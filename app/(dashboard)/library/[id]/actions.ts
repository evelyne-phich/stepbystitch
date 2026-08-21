'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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
 * Updates a tutorial's title, note/description, hook size (stitch), or difficulty level.
 */
export async function updateTutorialDetails(
  tutorialId: string,
  updates: {
    title: string;
    note?: string | null;
    stitch?: string | null;
    level?: string | null;
  }
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await (supabase.from('tutorials') as any)
    .update({
      title: updates.title.trim(),
      note: updates.note ? updates.note.trim() : null,
      stitch: updates.stitch ? updates.stitch.trim() : null,
      level: updates.level ? updates.level.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tutorialId)
    .eq('user_id', user.id);

  if (error) {
    console.error('[Action updateTutorialDetails] Error updating tutorial:', error);
    throw new Error('Failed to update project details');
  }

  revalidatePath(`/library/${tutorialId}`);
  revalidatePath('/library');
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
  redirect('/library');
}

/**
 * Retrieves a cached translation or triggers on-demand AI translation for a pattern.
 */
export async function getOrTranslatePatternAction(
  tutorialId: string,
  targetLanguage: string
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
    // 2. Check if translation is already cached in Supabase
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
      .select('id, title, raw_content_language, materials')
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
    const { translateCrochetPatternWithGemini } = await import('@/lib/ai/translator');
    const result = await translateCrochetPatternWithGemini({
      tutorialId,
      title: tutorial.title,
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
