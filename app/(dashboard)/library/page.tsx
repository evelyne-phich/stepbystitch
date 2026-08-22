import { createClient, createAdminClient } from '@/lib/supabase/server';
import { LibraryView } from '@/components/dashboard/library-view';
import type { TutorialWithProgress } from '@/lib/types/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let tutorials: TutorialWithProgress[] = [];

  if (user) {
    const { data: tutorialsData, error } = await (supabase
      .from('tutorials') as any)
      .select('*, checklist_items(id, checked), translations(target_language, content)')
      .order('saved_at', { ascending: false });
    
    if (error) {
      console.error('[LibraryPage] Error fetching tutorials with checklist_items:', error);
    }

    if (tutorialsData && tutorialsData.length > 0) {
      const adminClient = await createAdminClient();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

      tutorials = await Promise.all(
        tutorialsData.map(async (t: any) => {
          let coverImageUrl: string | null = null;
          let coverPdfUrl: string | null = null;
          let originalDocUrl: string | null = null;
          let isOriginalPdf = false;
          let hasCustomCover = false;
          let hasOriginalDoc = false;
          const folder = `${user.id}/${t.id}`;

          try {
            const { data: folderFiles } = await adminClient.storage
              .from('tutorial_files')
              .list(folder);

            const isCoverHidden = folderFiles?.some((f: any) => f.name === '.no_cover');

            // Check if user uploaded a custom cover image
            const customCover = folderFiles?.find(
              (f: any) =>
                f.name?.startsWith('cover_') &&
                imageExtensions.some((ext) => f.name?.toLowerCase().endsWith(ext))
            );
            hasCustomCover = Boolean(customCover);

            // Check if tutorial has an original document (image or PDF) in storage
            const originalImage = folderFiles?.find(
              (f: any) =>
                !f.name.startsWith('.') &&
                !f.name.startsWith('cover_') &&
                imageExtensions.some((ext) => f.name?.toLowerCase().endsWith(ext))
            );
            const originalPdf = folderFiles?.find(
              (f: any) =>
                !f.name.startsWith('.') &&
                !f.name.startsWith('cover_') &&
                f.name?.toLowerCase().endsWith('.pdf')
            );
            hasOriginalDoc = Boolean(originalImage || originalPdf);
            isOriginalPdf = Boolean(originalPdf);

            // Always sign the original document URL so the editor modal can preview and restore it
            if (originalImage) {
              const { data: signedData } = await adminClient.storage
                .from('tutorial_files')
                .createSignedUrl(`${folder}/${originalImage.name}`, 3600);
              originalDocUrl = signedData?.signedUrl || null;
            } else if (originalPdf) {
              const { data: signedData } = await adminClient.storage
                .from('tutorial_files')
                .createSignedUrl(`${folder}/${originalPdf.name}`, 3600);
              originalDocUrl = signedData?.signedUrl || null;
            }

            if (!isCoverHidden) {
              if (customCover) {
                const { data: signedData } = await adminClient.storage
                  .from('tutorial_files')
                  .createSignedUrl(`${folder}/${customCover.name}`, 3600);
                coverImageUrl = signedData?.signedUrl || null;
              } else if (originalImage) {
                coverImageUrl = originalDocUrl;
              } else if (originalPdf) {
                coverPdfUrl = originalDocUrl;
              }
            }
          } catch (err) {
            console.warn('[LibraryPage] Error signing folder cover files:', err);
          }

          const items = t.checklist_items || [];
          const totalSteps = items.length;
          const completedSteps = items.filter((i: any) => i.checked).length;
          const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
          const isCompleted = totalSteps > 0 && completedSteps === totalSteps;

          return {
            ...t,
            totalSteps,
            completedSteps,
            progressPercent,
            isCompleted,
            coverImageUrl,
            coverPdfUrl,
            originalDocUrl,
            isOriginalPdf,
            hasCustomCover,
            hasOriginalDoc,
          };
        })
      );
    }
  }

  return <LibraryView initialTutorials={tutorials} />;
}
