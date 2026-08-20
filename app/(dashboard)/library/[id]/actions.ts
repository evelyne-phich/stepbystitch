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
