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

      // Fetch all global translations from app_settings
      const { data: globalTrSettings } = await (adminClient.from('app_settings') as any)
        .select('key, value')
        .like('key', 'tr:%');

      const globalTrMap = new Map<string, Record<string, any>>();
      if (globalTrSettings && Array.isArray(globalTrSettings)) {
        globalTrSettings.forEach((row: any) => {
          const parts = row.key.split(':');
          const hash = parts[1];
          const lang = parts[2];
          if (hash && lang && row.value) {
            if (!globalTrMap.has(hash)) globalTrMap.set(hash, {});
            globalTrMap.get(hash)![lang] = row.value;
          }
        });
      }

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
              (f: any) => !f.name.startsWith('.') && f.name?.toLowerCase().endsWith('.pdf')
            );
            hasOriginalDoc = Boolean(originalImage || originalPdf);

            if (customCover) {
              const { data: signedCover } = await adminClient.storage
                .from('tutorial_files')
                .createSignedUrl(`${folder}/${customCover.name}`, 3600);
              coverImageUrl = signedCover?.signedUrl || null;
            }

            if (originalImage) {
              const { data: signedOriginal } = await adminClient.storage
                .from('tutorial_files')
                .createSignedUrl(`${folder}/${originalImage.name}`, 3600);
              originalDocUrl = signedOriginal?.signedUrl || null;
              isOriginalPdf = false;
              if (!customCover && !isCoverHidden) {
                coverImageUrl = originalDocUrl;
              }
            } else if (originalPdf) {
              const { data: signedPdf } = await adminClient.storage
                .from('tutorial_files')
                .createSignedUrl(`${folder}/${originalPdf.name}`, 3600);
              originalDocUrl = signedPdf?.signedUrl || null;
              isOriginalPdf = true;
              if (!customCover && !isCoverHidden) {
                coverPdfUrl = originalDocUrl;
              }
            } else if (t.source_type === 'image' && t.file_path && !customCover && !isCoverHidden) {
              const { data: signedFallback } = await adminClient.storage
                .from('tutorial_files')
                .createSignedUrl(t.file_path, 3600);
              coverImageUrl = signedFallback?.signedUrl || null;
              originalDocUrl = coverImageUrl;
              hasOriginalDoc = Boolean(originalDocUrl);
            } else if (t.source_type === 'pdf' && t.file_path && !customCover && !isCoverHidden) {
              const { data: signedFallbackPdf } = await adminClient.storage
                .from('tutorial_files')
                .createSignedUrl(t.file_path, 3600);
              originalDocUrl = signedFallbackPdf?.signedUrl || null;
              isOriginalPdf = true;
              hasOriginalDoc = Boolean(originalDocUrl);
              if (originalImage) {
                // Keep image cover if present
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

          const rawContent = t.raw_content || '';
          const contentHash = rawContent.startsWith('hash:') ? rawContent.replace('hash:', '') : null;
          let effectiveTranslations = Array.isArray(t.translations) ? [...t.translations] : [];

          if (contentHash && globalTrMap.has(contentHash)) {
            const globalLangs = globalTrMap.get(contentHash)!;
            Object.entries(globalLangs).forEach(([lang, content]) => {
              if (!effectiveTranslations.some((tr: any) => tr.target_language === lang)) {
                effectiveTranslations.push({
                  target_language: lang,
                  content,
                });
              }
            });
          }

          return {
            ...t,
            translations: effectiveTranslations,
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
