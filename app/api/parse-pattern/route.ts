import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { parsePatternWithGemini, type ParsePatternInput } from '@/lib/ai/client';
import { CROCHET_PARSER_SYSTEM_INSTRUCTION } from '@/lib/ai/prompts';
import { checkUserUploadQuota, recordAiTokenUsage } from '@/lib/ai/usage-tracker';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import type { SourceType } from '@/lib/types/database';

export const maxDuration = 120; // Allow up to 120 seconds for multi-page AI OCR and parsing

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();
  console.log(`[API /api/parse-pattern] 📥 Incoming pattern parse request...`);

  try {
    // 1. Authenticate user session
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn(`[API /api/parse-pattern] 🔒 Unauthorized request:`, authError?.message);
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be logged in to import patterns.' },
        { status: 401 }
      );
    }

    console.log(`[API /api/parse-pattern] 👤 User authenticated: ${user.id} (${user.email})`);

    // Anti-abuse: check disposable email
    const { isDisposableEmail } = await import('@/lib/auth/email-validator');
    if (user.email && isDisposableEmail(user.email)) {
      console.warn(`[API /api/parse-pattern] 🚫 Blocked disposable email user: ${user.email}`);
      return NextResponse.json(
        {
          error: 'DISPOSABLE_EMAIL_BLOCKED',
          message: 'Disposable/temporary email addresses are not permitted to use the AI extraction engine.',
        },
        { status: 403 }
      );
    }

    // Anti-bot & Anti-abuse: Sliding Window Rate Limiting (max 5 requests per 60 seconds per user)
    const rateLimit = checkRateLimit(`parse_pattern:${user.id}`, 5, 60_000);
    if (!rateLimit.allowed) {
      console.warn(
        `[API /api/parse-pattern] 🛑 Rate limit exceeded for user ${user.id}. Retry after ${rateLimit.retryAfterSeconds}s`
      );
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: `Too many requests. Please wait ${rateLimit.retryAfterSeconds} seconds before importing another pattern.`,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    // 2. Verify User Upload Quota (Free tier: max 3 patterns, Safety cap: 500/month)
    const quota = await checkUserUploadQuota(user.id);
    if (!quota.canUpload) {
      if (quota.reason === 'ABNORMAL_ACTIVITY') {
        console.warn(
          `[API /api/parse-pattern] 🛑 Monthly safety cap exceeded for user ${user.id} (${quota.currentCount}/${quota.maxAllowed})`
        );
        return NextResponse.json(
          {
            error: 'ABNORMAL_ACTIVITY',
            message: 'Unusual activity detected: automatic imports are temporarily suspended to protect our servers.',
            currentCount: quota.currentCount,
            maxAllowed: quota.maxAllowed,
          },
          { status: 429 }
        );
      }

      console.warn(
        `[API /api/parse-pattern] 🚫 Quota exceeded for user ${user.id} (${quota.currentCount}/${quota.maxAllowed})`
      );
      return NextResponse.json(
        {
          error: 'QUOTA_EXCEEDED',
          message: 'Quota limit reached: you have reached the 3 patterns limit on the Free plan.',
          currentCount: quota.currentCount,
          maxAllowed: quota.maxAllowed,
        },
        { status: 403 }
      );
    }

    // 3. Parse FormData
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const rawText = (formData.get('rawText') as string) || '';
    const userTitle = (formData.get('title') as string) || '';
    const userNote = (formData.get('note') as string) || '';

    console.log(
      `[API /api/parse-pattern] 📦 Payload received: ${files.length} file(s), rawText length=${rawText.length}, userTitle="${userTitle}"`
    );

    if (files.length === 0 && (!rawText || !rawText.trim())) {
      console.warn(`[API /api/parse-pattern] ⚠️ No files or text provided in payload.`);
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Please provide at least one pattern file (PDF/images) or raw pattern text.' },
        { status: 400 }
      );
    }

    // 4. Process files into Buffers and compute SHA-256 content hash
    const aiFiles: NonNullable<ParsePatternInput['files']> = [];
    let primarySourceType: SourceType = 'text';
    let primaryFilePath = 'raw_text';
    let primaryFileName: string | null = null;
    let primaryFileType: string | null = null;

    const tutorialId = crypto.randomUUID();
    const sha256Hasher = createHash('sha256');

    // Automatically bind the current system prompt instructions into the SHA-256 hash.
    // Any prompt or rules refinement will automatically bust stale cache with zero manual version management!
    sha256Hasher.update(CROCHET_PARSER_SYSTEM_INSTRUCTION);

    if (files.length > 0) {
      const firstFile = files[0];
      const isPdf = firstFile.type === 'application/pdf' || firstFile.name.endsWith('.pdf');
      primarySourceType = isPdf ? 'pdf' : 'image';
      primaryFileName = firstFile.name;
      primaryFileType = firstFile.type;

      // Upload files to Supabase Private Storage `tutorial_files` bucket
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Feed buffer into SHA-256 hasher for cache detection
        sha256Hasher.update(buffer);

        aiFiles.push({
          buffer,
          mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
          fileName: file.name,
        });

        // Generate clean storage path: user_id/tutorial_id/filename
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${user.id}/${tutorialId}/${Date.now()}_${safeName}`;

        if (i === 0) {
          primaryFilePath = storagePath;
        }

        console.log(
          `[API /api/parse-pattern] ☁️ Uploading "${file.name}" to storage bucket "tutorial_files" at path "${storagePath}"...`
        );

        const { error: uploadError } = await supabase.storage
          .from('tutorial_files')
          .upload(storagePath, buffer, {
            contentType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
            upsert: false,
          });

        if (uploadError) {
          console.error(`[API /api/parse-pattern] ❌ Storage upload failed for "${file.name}":`, uploadError);
        } else {
          console.log(`[API /api/parse-pattern] ✅ File uploaded successfully to private storage.`);
        }
      }
    } else {
      // Feed trimmed text into SHA-256 hasher
      const trimmedText = rawText.trim();
      sha256Hasher.update(trimmedText);

      // Upload raw text as .txt file into Supabase Private Storage `tutorial_files`
      const storagePath = `${user.id}/${tutorialId}/original_pattern.txt`;
      primaryFilePath = storagePath;
      primaryFileName = 'patron_original.txt';
      primaryFileType = 'text/plain';

      const textBuffer = Buffer.from(trimmedText, 'utf-8');
      console.log(
        `[API /api/parse-pattern] ☁️ Uploading raw text (${trimmedText.length} chars) to storage bucket "tutorial_files" at path "${storagePath}"...`
      );

      const { error: uploadError } = await supabase.storage
        .from('tutorial_files')
        .upload(storagePath, textBuffer, {
          contentType: 'text/plain; charset=utf-8',
          upsert: false,
        });

      if (uploadError) {
        console.warn(`[API /api/parse-pattern] Storage upload notice for raw text:`, uploadError);
      } else {
        console.log(`[API /api/parse-pattern] ✅ Raw text uploaded successfully to private storage.`);
      }
    }

    const contentHash = sha256Hasher.digest('hex');
    console.log(`[API /api/parse-pattern] 🔑 SHA-256 hash computed: ${contentHash}`);

    // 5. Check if this exact pattern is ALREADY in the current user's library
    const trimmedRawText = rawText ? rawText.trim() : null;
    let existingQuery = (supabase.from('tutorials') as any)
      .select('id, title')
      .eq('user_id', user.id);

    if (trimmedRawText) {
      existingQuery = existingQuery.or(`raw_content.eq.hash:${contentHash},raw_content.eq."${trimmedRawText.replace(/"/g, '""')}"`);
    } else {
      existingQuery = existingQuery.eq('raw_content', `hash:${contentHash}`);
    }

    const { data: userExistingTutorial } = await existingQuery.limit(1);

    if (userExistingTutorial && userExistingTutorial.length > 0) {
      console.log(
        `[API /api/parse-pattern] ℹ️ Pattern already exists in user's library: ${userExistingTutorial[0].id}`
      );
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        tutorialId: userExistingTutorial[0].id,
        title: userExistingTutorial[0].title,
      });
    }

    // 6. Check Permanent Pattern Cache (to bypass Gemini even if original project was deleted)
    let pattern: any = null;
    let isCacheHit = false;

    try {
      const adminClient = await createAdminClient();

      // Step 6A: Check dedicated permanent cache table
      const { data: cachedRows, error: cacheRowErr } = await (adminClient.from('pattern_cache') as any)
        .select('*')
        .eq('content_hash', contentHash)
        .limit(1);

      if (!cacheRowErr && cachedRows && cachedRows.length > 0) {
        const cached = cachedRows[0];
        console.log(
          `[API /api/parse-pattern] ⚡ PERMANENT CACHE HIT for SHA-256 ${contentHash}! Bypassing Gemini AI!`
        );
        pattern = {
          title: cached.title,
          language: cached.language,
          project_type: cached.project_type,
          level: cached.level,
          hook_size: cached.stitch,
          materials: cached.materials || [],
          gauge: cached.gauge,
          summary: cached.summary,
          sections: Array.isArray(cached.sections) ? cached.sections : [],
          steps: Array.isArray(cached.steps) ? cached.steps : [],
        };
        isCacheHit = true;
      }

      // Step 6B: Fallback check in tutorials table
      if (!pattern) {
        let cachedTutQuery = (adminClient.from('tutorials') as any)
          .select('id, title, stitch, level, project_type, materials, gauge, raw_content_language, note');

        if (trimmedRawText) {
          cachedTutQuery = cachedTutQuery.or(`raw_content.eq.hash:${contentHash},raw_content.eq."${trimmedRawText.replace(/"/g, '""')}"`);
        } else {
          cachedTutQuery = cachedTutQuery.eq('raw_content', `hash:${contentHash}`);
        }

        const { data: cachedTutorials, error: cacheErr } = await cachedTutQuery.limit(1);

        if (!cacheErr && cachedTutorials && cachedTutorials.length > 0) {
          const cachedTut = cachedTutorials[0] as any;
          const { data: cachedSteps, error: stepsErr } = await (adminClient.from('checklist_items') as any)
            .select('label, section, order_index, note')
            .eq('tutorial_id', cachedTut.id)
            .order('order_index', { ascending: true });

          if (!stepsErr && cachedSteps && cachedSteps.length > 0) {
            console.log(
              `[API /api/parse-pattern] ⚡ TUTORIALS CACHE HIT! Reusing parsed pattern (${cachedSteps.length} steps) for SHA-256 ${contentHash}. Bypassing Gemini AI!`
            );
            pattern = {
              title: cachedTut.title,
              language: cachedTut.raw_content_language,
              project_type: cachedTut.project_type,
              level: cachedTut.level,
              hook_size: cachedTut.stitch,
              materials: cachedTut.materials || [],
              gauge: cachedTut.gauge,
              summary: cachedTut.note,
              sections: Array.from(new Set(cachedSteps.map((s: any) => s.section))),
              steps: cachedSteps,
            };
            isCacheHit = true;
          }
        }
      }
    } catch (cacheLookupErr) {
      console.warn('[API /api/parse-pattern] Cache lookup skipped, proceeding with Gemini AI:', cacheLookupErr);
    }

    // 7. Call Gemini Multimodal AI extraction only on cache miss
    if (!pattern) {
      console.log(`[API /api/parse-pattern] 🤖 Cache miss. Triggering Gemini AI extraction pipeline...`);
      const aiResult = await parsePatternWithGemini({
        files: aiFiles.length > 0 ? aiFiles : undefined,
        rawText: rawText.trim() || undefined,
        userHint: userNote.trim() || undefined,
      });

      pattern = aiResult.pattern;

      // Record Token Usage only on actual Gemini API calls
      await recordAiTokenUsage({
        userId: user.id,
        action: 'parse_pattern',
        inputTokens: aiResult.usage.inputTokens,
        outputTokens: aiResult.usage.outputTokens,
        totalTokens: aiResult.usage.totalTokens,
        modelUsed: aiResult.usage.modelUsed,
      });

      // Save permanently into pattern_cache for all future uploads
      try {
        const adminClient = await createAdminClient();
        await (adminClient.from('pattern_cache') as any).upsert(
          {
            content_hash: contentHash,
            title: pattern.title || primaryFileName || 'Mon patron de crochet',
            language: pattern.language || null,
            project_type: pattern.project_type || null,
            level: pattern.level || null,
            stitch: pattern.hook_size || null,
            materials: pattern.materials || [],
            gauge: pattern.gauge || null,
            summary: pattern.summary || null,
            sections: pattern.sections || [],
            steps: pattern.steps || [],
          },
          { onConflict: 'content_hash' }
        );
      } catch (cacheSaveErr) {
        console.warn('[API /api/parse-pattern] Non-blocking cache save error:', cacheSaveErr);
      }
    }

    const finalTitle = userTitle.trim() || pattern.title || primaryFileName || 'Mon patron de crochet';

    // 7. Insert Tutorial into Database (with resilient source_type check fallback)
    console.log(`[API /api/parse-pattern] 💾 Saving tutorial "${finalTitle}" to database (cached=${isCacheHit})...`);
    const tutorialPayload = {
      id: tutorialId,
      user_id: user.id,
      title: finalTitle,
      source_type: primarySourceType,
      file_path: primaryFilePath,
      file_name: primaryFileName,
      file_type: primaryFileType,
      note: userNote || pattern.summary || null,
      raw_content: primarySourceType === 'text' ? rawText.trim() : `hash:${contentHash}`,
      raw_content_language: pattern.language || null,
      stitch: pattern.hook_size || null,
      level: pattern.level || null,
      project_type: pattern.project_type || null,
      materials: pattern.materials || [],
      gauge: pattern.gauge || null,
    };

    let { data: tutorial, error: tutorialError } = await (supabase.from('tutorials') as any)
      .insert(tutorialPayload)
      .select()
      .single();

    // If source_type check constraint failed (e.g. DB expects 'screenshot' instead of 'image'), retry with fallback
    if (tutorialError && tutorialError.message?.includes('tutorials_source_type_check')) {
      console.warn(`[API /api/parse-pattern] ⚠️ tutorials_source_type_check mismatch for "${primarySourceType}". Retrying with fallback...`);
      const fallbackSourceType = primarySourceType === 'image' ? 'screenshot' : (primarySourceType === 'text' ? 'manuscrit' : 'pdf');
      const fallbackResult = await (supabase.from('tutorials') as any)
        .insert({ ...tutorialPayload, source_type: fallbackSourceType })
        .select()
        .single();
      tutorial = fallbackResult.data;
      tutorialError = fallbackResult.error;
    }

    if (tutorialError || !tutorial) {
      console.error(`[API /api/parse-pattern] ❌ Error inserting tutorial:`, tutorialError);
      throw new Error(`Database error saving tutorial: ${tutorialError?.message}`);
    }

    // 8. Insert Checklist Items
    if (pattern.steps && pattern.steps.length > 0) {
      console.log(
        `[API /api/parse-pattern] 📋 Inserting ${pattern.steps.length} checklist steps into database...`
      );

      const itemsToInsert = pattern.steps.map((step: any, idx: number) => ({
        tutorial_id: tutorial.id,
        label: step.label,
        section: step.section || 'General',
        order_index: typeof step.order_index === 'number' ? step.order_index : idx,
        checked: false,
        note: step.note || null,
        edited_by_user: false,
      }));

      const { error: itemsError } = await (supabase.from('checklist_items') as any).insert(itemsToInsert);

      if (itemsError) {
        console.error(`[API /api/parse-pattern] ❌ Error inserting checklist items:`, itemsError);
      } else {
        console.log(`[API /api/parse-pattern] ✅ Checklist items inserted successfully.`);
      }
    }

    const totalDuration = Date.now() - requestStartTime;
    console.log(
      `[API /api/parse-pattern] 🎉 Pattern ingestion completed in ${totalDuration}ms (cacheHit=${isCacheHit}). Tutorial ID: ${tutorial.id}`
    );

    return NextResponse.json({
      success: true,
      tutorialId: tutorial.id,
      title: tutorial.title,
      stepsCount: pattern.steps?.length || 0,
      sectionsCount: pattern.sections?.length || 0,
      cached: isCacheHit,
    });
  } catch (error: any) {
    const totalDuration = Date.now() - requestStartTime;
    console.error(`[API /api/parse-pattern] ❌ Unhandled error after ${totalDuration}ms:`, error);

    return NextResponse.json(
      {
        error: 'PROCESSING_ERROR',
        message: error.message || 'An error occurred while analyzing the pattern with AI.',
      },
      { status: 500 }
    );
  }
}
