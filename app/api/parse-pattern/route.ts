import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { parsePatternWithGemini, type ParsePatternInput } from '@/lib/ai/client';
import { checkUserUploadQuota, recordAiTokenUsage } from '@/lib/ai/usage-tracker';
import type { SourceType } from '@/lib/types/database';

export const maxDuration = 60; // Allow up to 60 seconds for AI processing and PDF OCR

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

    // 2. Verify User Upload Quota (Free tier: max 3 patterns)
    const quota = await checkUserUploadQuota(user.id);
    if (!quota.canUpload) {
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

    // 4. Process files into Buffers
    const aiFiles: NonNullable<ParsePatternInput['files']> = [];
    let primarySourceType: SourceType = 'text';
    let primaryFilePath = 'raw_text';
    let primaryFileName: string | null = null;
    let primaryFileType: string | null = null;

    const tutorialId = crypto.randomUUID();

    if (files.length > 0) {
      const firstFile = files[0];
      const isPdf = firstFile.type === 'application/pdf' || firstFile.name.endsWith('.pdf');
      primarySourceType = isPdf ? 'pdf' : 'image';
      primaryFileName = firstFile.name;
      primaryFileType = firstFile.type;

      // Upload files to Supabase Private Storage `patterns` bucket
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

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
          `[API /api/parse-pattern] ☁️ Uploading "${file.name}" to storage bucket "patterns" at path "${storagePath}"...`
        );

        const { error: uploadError } = await supabase.storage
          .from('patterns')
          .upload(storagePath, buffer, {
            contentType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
            upsert: false,
          });

        if (uploadError) {
          console.error(`[API /api/parse-pattern] ❌ Storage upload failed for "${file.name}":`, uploadError);
          // Non-blocking: continue if AI can still parse, but log error
        } else {
          console.log(`[API /api/parse-pattern] ✅ File uploaded successfully to private storage.`);
        }
      }
    }

    // 5. Call Gemini Multimodal AI extraction
    console.log(`[API /api/parse-pattern] 🤖 Triggering Gemini AI extraction pipeline...`);
    const aiResult = await parsePatternWithGemini({
      files: aiFiles.length > 0 ? aiFiles : undefined,
      rawText: rawText.trim() || undefined,
      userHint: userNote.trim() || undefined,
    });

    const { pattern, usage } = aiResult;
    const finalTitle = userTitle.trim() || pattern.title || primaryFileName || 'Mon patron de crochet';

    // 6. Record Token Usage
    await recordAiTokenUsage({
      userId: user.id,
      action: 'parse_pattern',
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      modelUsed: usage.modelUsed,
    });

    // 7. Insert Tutorial into Database
    console.log(`[API /api/parse-pattern] 💾 Saving tutorial "${finalTitle}" to database...`);
    const { data: tutorial, error: tutorialError } = await (supabase.from('tutorials') as any)
      .insert({
        id: tutorialId,
        user_id: user.id,
        title: finalTitle,
        source_type: primarySourceType,
        file_path: primaryFilePath,
        file_name: primaryFileName,
        file_type: primaryFileType,
        note: userNote || pattern.summary || null,
        raw_content: rawText || null,
        raw_content_language: pattern.language || 'en_us',
        stitch: pattern.hook_size || null,
        level: pattern.level || 'intermediaire',
        project_type: pattern.project_type || 'amigurumi',
        materials: pattern.materials || [],
        gauge: pattern.gauge || null,
      })
      .select()
      .single();

    if (tutorialError || !tutorial) {
      console.error(`[API /api/parse-pattern] ❌ Error inserting tutorial:`, tutorialError);
      throw new Error(`Database error saving tutorial: ${tutorialError?.message}`);
    }

    // 8. Insert Checklist Items
    if (pattern.steps && pattern.steps.length > 0) {
      console.log(
        `[API /api/parse-pattern] 📋 Inserting ${pattern.steps.length} checklist steps into database...`
      );

      const itemsToInsert = pattern.steps.map((step, idx) => ({
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
        // Tutorial is saved, so we return with warning
      } else {
        console.log(`[API /api/parse-pattern] ✅ Checklist items inserted successfully.`);
      }
    }

    const totalDuration = Date.now() - requestStartTime;
    console.log(
      `[API /api/parse-pattern] 🎉 Pattern ingestion completed successfully in ${totalDuration}ms. Tutorial ID: ${tutorial.id}`
    );

    return NextResponse.json({
      success: true,
      tutorialId: tutorial.id,
      title: tutorial.title,
      stepsCount: pattern.steps?.length || 0,
      sectionsCount: pattern.sections?.length || 0,
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
