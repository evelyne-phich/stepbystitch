'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * Toggles a checklist step completed status.
 */
export async function toggleChecklistItem(itemId: string, checked: boolean) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await (supabase.from('checklist_items') as any)
    .update({ checked, updated_at: new Date().toISOString() })
    .eq('id', itemId);

  if (error) {
    console.error('[Action toggleChecklistItem] Error updating item:', error);
    throw new Error('Failed to update checklist item');
  }

  revalidatePath('/library');
}

/**
 * Updates a checklist step label or personal notes.
 */
export async function updateChecklistItem(
  itemId: string,
  label: string,
  note?: string | null
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await (supabase.from('checklist_items') as any)
    .update({
      label: label.trim(),
      note: note ? note.trim() : null,
      edited_by_user: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (error) {
    console.error('[Action updateChecklistItem] Error editing item:', error);
    throw new Error('Failed to edit checklist item');
  }
}

/**
 * Updates a specific step label or note within a cached translation.
 */
export async function updateTranslationStep(
  tutorialId: string,
  targetLanguage: string,
  orderIndex: number,
  label: string,
  note?: string | null
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  try {
    const { data: trRow } = await (supabase.from('translations') as any)
      .select('id, content')
      .eq('tutorial_id', tutorialId)
      .eq('target_language', targetLanguage)
      .single();

    if (trRow && trRow.content && typeof trRow.content === 'object') {
      const updatedSteps = (trRow.content.steps || []).map((s: any) =>
        s.order_index === orderIndex
          ? { ...s, label: label.trim(), note: note ? note.trim() : null }
          : s
      );

      const updatedContent = {
        ...trRow.content,
        steps: updatedSteps,
      };

      await (supabase.from('translations') as any)
        .update({
          content: updatedContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', trRow.id);
    }
  } catch (err) {
    console.error('[Action updateTranslationStep] Error updating translation step:', err);
    throw new Error('Failed to update translation step');
  }
}

/**
 * Updates a tutorial's title, note/description, hook size (stitch), or difficulty level.
 */
export async function updateTutorialDetails(
  tutorialId: string,
  updates: {
    title: string;
    note?: string | null;
    stitch?: string | null;
    level?: string | null;
    project_type?: string | null;
    targetLanguage?: string | null;
  }
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Fetch current tutorial to check if title was explicitly modified
  const { data: currentTutorial } = await (supabase.from('tutorials') as any)
    .select('title')
    .eq('id', tutorialId)
    .eq('user_id', user.id)
    .single();

  const newTitle = updates.title.trim();
  const isTitleModifiedByUser = Boolean(currentTutorial && newTitle && newTitle !== currentTutorial.title);

  // 1. Update universal project attributes on the tutorials table (including universal title & notes)
  const tutorialFieldsToUpdate: Record<string, any> = {
    title: newTitle,
    note: updates.note !== undefined ? (updates.note ? updates.note.trim() : null) : undefined,
    stitch: updates.stitch !== undefined ? (updates.stitch ? updates.stitch.trim() : null) : undefined,
    level: updates.level !== undefined ? (updates.level ? updates.level.trim() : null) : undefined,
    project_type: updates.project_type !== undefined ? (updates.project_type ? updates.project_type.trim() : null) : undefined,
    updated_at: new Date().toISOString(),
  };

  Object.keys(tutorialFieldsToUpdate).forEach((k) => {
    if (tutorialFieldsToUpdate[k] === undefined) delete tutorialFieldsToUpdate[k];
  });

  const { error } = await (supabase.from('tutorials') as any)
    .update(tutorialFieldsToUpdate)
    .eq('id', tutorialId)
    .eq('user_id', user.id);

  if (error) {
    console.error('[Action updateTutorialDetails] Error updating tutorial:', error);
    throw new Error('Failed to update project details');
  }

  // 2. Only if the user explicitly customized/renamed the title, sync that custom title into translations
  if (isTitleModifiedByUser) {
    try {
      const { data: translations } = await (supabase.from('translations') as any)
        .select('id, content')
        .eq('tutorial_id', tutorialId);

      if (translations && translations.length > 0) {
        for (const trRow of translations) {
          if (trRow && trRow.content && typeof trRow.content === 'object') {
            const updatedContent = {
              ...trRow.content,
              title: newTitle,
            };

            await (supabase.from('translations') as any)
              .update({
                content: updatedContent,
                updated_at: new Date().toISOString(),
              })
              .eq('id', trRow.id);
          }
        }
      }
    } catch (trErr) {
      console.warn('[Action updateTutorialDetails] Error syncing translations:', trErr);
    }
  }

  revalidatePath(`/library/${tutorialId}`);
  revalidatePath('/library');
}

/**
 * Uploads or updates a custom cover photo for a tutorial.
 */
export async function updateTutorialCoverImage(
  tutorialId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const file = formData.get('coverImage') as File | null;
  if (!file) {
    throw new Error('No file provided');
  }

  // Validate MIME type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WEBP images are supported.');
  }

  // Validate File size (Max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size exceeds 10MB limit.');
  }

  const folder = `${user.id}/${tutorialId}`;
  const fileExt = file.name.split('.').pop() || 'jpg';
  const filePath = `${folder}/cover_${Date.now()}.${fileExt}`;

  // Upload to Supabase private storage bucket 'tutorial_files' using adminClient
  const adminClient = await createAdminClient();

  // Clean up any previous cover images or .no_cover marker
  try {
    const { data: existingFiles } = await adminClient.storage
      .from('tutorial_files')
      .list(folder);

    const filesToRemove = (existingFiles || [])
      .filter((f: any) => f.name === '.no_cover' || f.name.startsWith('cover_'))
      .map((f: any) => `${folder}/${f.name}`);

    if (filesToRemove.length > 0) {
      await adminClient.storage.from('tutorial_files').remove(filesToRemove);
    }
  } catch (cleanErr) {
    console.warn('[Action updateTutorialCoverImage] Clean warning:', cleanErr);
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await adminClient.storage
    .from('tutorial_files')
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('[Action updateTutorialCoverImage] Upload error:', uploadError);
    throw new Error('Failed to upload cover image');
  }

  // Generate signed URL for immediate client feedback
  const { data: signedData } = await adminClient.storage
    .from('tutorial_files')
    .createSignedUrl(filePath, 3600);

  revalidatePath('/library');
  revalidatePath(`/library/${tutorialId}`);

  return {
    success: true,
    coverImageUrl: signedData?.signedUrl || null,
  };
}

/**
 * Removes custom/default cover image from the library card (marks as hidden and shows craft placeholder).
 */
export async function deleteTutorialCoverImage(tutorialId: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const folder = `${user.id}/${tutorialId}`;
  const adminClient = await createAdminClient();

  try {
    // 1. Remove any custom cover_* files
    const { data: existingFiles } = await adminClient.storage
      .from('tutorial_files')
      .list(folder);

    const coverFiles = (existingFiles || [])
      .filter((f: any) => f.name.startsWith('cover_'))
      .map((f: any) => `${folder}/${f.name}`);

    if (coverFiles.length > 0) {
      await adminClient.storage.from('tutorial_files').remove(coverFiles);
    }

    // 2. Upload .no_cover marker to hide even default image/PDF thumbnail
    await adminClient.storage
      .from('tutorial_files')
      .upload(`${folder}/.no_cover`, Buffer.from('hidden'), {
        contentType: 'text/plain',
        upsert: true,
      });
  } catch (storageErr) {
    console.error('[Action deleteTutorialCoverImage] Storage error:', storageErr);
    throw new Error('Failed to remove cover image');
  }

  revalidatePath('/library');
  revalidatePath(`/library/${tutorialId}`);

  return {
    success: true,
    coverImageUrl: null,
    coverPdfUrl: null,
  };
}

/**
 * Restores the original document (image/PDF) as the cover image.
 */
export async function resetTutorialCoverToOriginal(tutorialId: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const folder = `${user.id}/${tutorialId}`;
  const adminClient = await createAdminClient();

  // Remove .no_cover marker and any custom cover_*
  try {
    const { data: existingFiles } = await adminClient.storage
      .from('tutorial_files')
      .list(folder);

    const toRemove = (existingFiles || [])
      .filter((f: any) => f.name === '.no_cover' || f.name.startsWith('cover_'))
      .map((f: any) => `${folder}/${f.name}`);

    if (toRemove.length > 0) {
      await adminClient.storage.from('tutorial_files').remove(toRemove);
    }
  } catch (cleanErr) {
    console.warn('[Action resetTutorialCoverToOriginal] Clean warning:', cleanErr);
  }

  // Get original files in folder to sign
  let fallbackCoverUrl: string | null = null;
  let fallbackPdfUrl: string | null = null;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  try {
    const { data: folderFiles } = await adminClient.storage
      .from('tutorial_files')
      .list(folder);

    const imageFile = folderFiles?.find((f: any) =>
      imageExtensions.some((ext) => f.name?.toLowerCase().endsWith(ext))
    );

    if (imageFile) {
      const { data: signedData } = await adminClient.storage
        .from('tutorial_files')
        .createSignedUrl(`${folder}/${imageFile.name}`, 3600);
      fallbackCoverUrl = signedData?.signedUrl || null;
    } else {
      const pdfFile = folderFiles?.find((f: any) =>
        f.name?.toLowerCase().endsWith('.pdf')
      );
      if (pdfFile) {
        const { data: signedData } = await adminClient.storage
          .from('tutorial_files')
          .createSignedUrl(`${folder}/${pdfFile.name}`, 3600);
        fallbackPdfUrl = signedData?.signedUrl || null;
      }
    }
  } catch (err) {
    console.warn('[Action resetTutorialCoverToOriginal] Error signing original file:', err);
  }

  revalidatePath('/library');
  revalidatePath(`/library/${tutorialId}`);

  return {
    success: true,
    coverImageUrl: fallbackCoverUrl,
    coverPdfUrl: fallbackPdfUrl,
  };
}

/**
 * Resets all checklist items of a tutorial to unchecked.
 */
export async function resetAllChecklistItems(tutorialId: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await (supabase.from('checklist_items') as any)
    .update({ checked: false, updated_at: new Date().toISOString() })
    .eq('tutorial_id', tutorialId);

  if (error) {
    console.error('[Action resetAllChecklistItems] Error resetting items:', error);
    throw new Error('Failed to reset items');
  }

  revalidatePath('/library');
}

/**
 * Resets all checklist items of a specific section to unchecked.
 */
export async function resetSectionChecklistItems(tutorialId: string, sectionName: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await (supabase.from('checklist_items') as any)
    .update({ checked: false, updated_at: new Date().toISOString() })
    .eq('tutorial_id', tutorialId)
    .eq('section', sectionName);

  if (error) {
    console.error('[Action resetSectionChecklistItems] Error resetting section items:', error);
    throw new Error('Failed to reset section items');
  }

  revalidatePath('/library');
}

/**
 * Updates a batch of checklist item IDs to checked or unchecked.
 */
export async function updateChecklistItemsBatch(tutorialId: string, itemIds: string[], checked: boolean) {
  if (!itemIds.length) return;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await (supabase.from('checklist_items') as any)
    .update({ checked, updated_at: new Date().toISOString() })
    .eq('tutorial_id', tutorialId)
    .in('id', itemIds);

  if (error) {
    console.error('[Action updateChecklistItemsBatch] Error updating items:', error);
    throw new Error('Failed to update items');
  }

  revalidatePath('/library');
}

/**
 * Marks all checklist items of a tutorial as checked.
 */
export async function checkAllChecklistItems(tutorialId: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await (supabase.from('checklist_items') as any)
    .update({ checked: true, updated_at: new Date().toISOString() })
    .eq('tutorial_id', tutorialId);

  if (error) {
    console.error('[Action checkAllChecklistItems] Error checking all items:', error);
    throw new Error('Failed to check all items');
  }

  revalidatePath('/library');
}

/**
 * Deletes a tutorial and its associated files and checklist items.
 */
export async function deleteTutorial(tutorialId: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // 1. Get tutorial to retrieve file path
  const { data: tutorial } = await (supabase.from('tutorials') as any)
    .select('file_path')
    .eq('id', tutorialId)
    .eq('user_id', user.id)
    .single();

  if (tutorial?.file_path && tutorial.file_path !== 'raw_text') {
    // Delete file from storage
    await supabase.storage.from('tutorial_files').remove([tutorial.file_path]);
  }

  // 2. Delete tutorial (cascade deletes checklist_items, translations, progress_counters)
  const { error } = await (supabase.from('tutorials') as any)
    .delete()
    .eq('id', tutorialId)
    .eq('user_id', user.id);

  if (error) {
    console.error('[Action deleteTutorial] Error deleting tutorial:', error);
    throw new Error('Failed to delete tutorial');
  }

  revalidatePath('/library');
  return { success: true };
}

/**
 * Retrieves a cached translation or triggers on-demand AI translation for a pattern.
 */
export async function getOrTranslatePatternAction(
  tutorialId: string,
  targetLanguage: string,
  forceRefresh: boolean = false
): Promise<{
  success: boolean;
  cached: boolean;
  content?: any;
  error?: string;
}> {
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, cached: false, error: 'UNAUTHORIZED' };
  }

  try {
    // 2. Check if translation is already cached in Supabase translations table (if not forced to refresh)
    if (!forceRefresh) {
      const { data: existingTranslation } = await (supabase.from('translations') as any)
        .select('content, status')
        .eq('tutorial_id', tutorialId)
        .eq('target_language', targetLanguage)
        .single();

      if (existingTranslation && existingTranslation.status === 'done' && existingTranslation.content) {
        console.log(`[Action getOrTranslatePattern] ⚡ Cache HIT for tutorial ${tutorialId} (${targetLanguage})`);
        return {
          success: true,
          cached: true,
          content: existingTranslation.content,
        };
      }
    }

    // 2.b Check Global Translation Cache in app_settings by contentHash and prompt hash
    const { data: tutorialData } = await (supabase.from('tutorials') as any)
      .select('raw_content')
      .eq('id', tutorialId)
      .single();

    const rawContent = tutorialData?.raw_content || '';
    const contentHash = rawContent.startsWith('hash:') ? rawContent.replace('hash:', '') : null;

    const { getTranslationCacheKey, translateCrochetPatternWithGemini } = await import('@/lib/ai/translator');

    if (!forceRefresh && contentHash) {
      try {
        const adminClient = await createAdminClient();
        const globalCacheKey = getTranslationCacheKey(contentHash, targetLanguage);
        const { data: globalTr } = await (adminClient.from('app_settings') as any)
          .select('value')
          .eq('key', globalCacheKey)
          .single();

        if (globalTr && globalTr.value) {
          console.log(`[Action getOrTranslatePattern] ⚡ Global Cache HIT for key ${globalCacheKey}`);

          // Cache in current user's translations table for this tutorial
          await (supabase.from('translations') as any).upsert(
            {
              tutorial_id: tutorialId,
              target_language: targetLanguage,
              status: 'done',
              content: globalTr.value,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'tutorial_id, target_language' }
          );

          return {
            success: true,
            cached: true,
            content: globalTr.value,
          };
        }
      } catch (globalErr) {
        console.warn(`[Action getOrTranslatePattern] Global cache lookup warning:`, globalErr);
      }
    }

    // 3. Rate limiting check (max 5 requests per minute per user)
    const { checkRateLimit } = await import('@/lib/security/rate-limiter');
    const rateLimit = checkRateLimit(`translate_pattern:${user.id}`, 5, 60_000);
    if (!rateLimit.allowed) {
      return {
        success: false,
        cached: false,
        error: `RATE_LIMITED:${rateLimit.retryAfterSeconds}`,
      };
    }

    // 4. Fetch original tutorial and checklist items
    const { data: tutorial, error: tutorialError } = await (supabase.from('tutorials') as any)
      .select('id, title, note, raw_content_language, materials')
      .eq('id', tutorialId)
      .eq('user_id', user.id)
      .single();

    if (tutorialError || !tutorial) {
      return { success: false, cached: false, error: 'TUTORIAL_NOT_FOUND' };
    }

    const { data: checklistItems, error: itemsError } = await (supabase.from('checklist_items') as any)
      .select('id, label, section, order_index, note')
      .eq('tutorial_id', tutorialId)
      .order('order_index', { ascending: true });

    if (itemsError || !checklistItems || checklistItems.length === 0) {
      return { success: false, cached: false, error: 'NO_STEPS_FOUND' };
    }

    // Extract unique sections
    const sectionSet = new Set<string>();
    checklistItems.forEach((item: any) => {
      if (item.section) sectionSet.add(item.section);
    });
    const sections = Array.from(sectionSet);

    // 5. Execute translation via AI Engine
    const result = await translateCrochetPatternWithGemini({
      tutorialId,
      title: tutorial.title,
      note: tutorial.note,
      sourceLanguage: tutorial.raw_content_language || 'auto',
      targetLanguage: targetLanguage as any,
      materials: tutorial.materials || [],
      sections,
      steps: checklistItems,
    });

    // 6. Cache translated content into Supabase translations table
    const { error: upsertError } = await (supabase.from('translations') as any).upsert(
      {
        tutorial_id: tutorialId,
        target_language: targetLanguage,
        status: 'done',
        content: result.content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tutorial_id, target_language' }
    );

    if (upsertError) {
      console.warn('[Action getOrTranslatePattern] ⚠️ Failed to cache translation in Supabase:', upsertError);
    }

    // 6.b Save into global app_settings translation cache with prompt hash key
    if (contentHash) {
      try {
        const adminClient = await createAdminClient();
        const globalCacheKey = getTranslationCacheKey(contentHash, targetLanguage);
        await (adminClient.from('app_settings') as any).upsert(
          {
            key: globalCacheKey,
            value: result.content,
            description: `Global translation cache for ${globalCacheKey}`,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );
      } catch (globalSaveErr) {
        console.warn('[Action getOrTranslatePattern] ⚠️ Failed to save to global cache:', globalSaveErr);
      }
    }

    // 7. Record token consumption in ai_usage table
    const { recordAiTokenUsage } = await import('@/lib/ai/usage-tracker');
    await recordAiTokenUsage({
      userId: user.id,
      action: 'translate_pattern',
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      totalTokens: result.usage.totalTokens,
      modelUsed: result.usage.modelUsed,
    });

    console.log(`[Action getOrTranslatePattern] ✅ Successfully translated and cached tutorial ${tutorialId} to ${targetLanguage}`);

    return {
      success: true,
      cached: false,
      content: result.content,
    };
  } catch (err: any) {
    console.error('[Action getOrTranslatePattern] ❌ Translation failed:', err);
    return {
      success: false,
      cached: false,
      error: err.message || 'TRANSLATION_FAILED',
    };
  }
}
