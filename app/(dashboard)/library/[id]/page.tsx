import { notFound, redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { ProjectDetailView } from '@/components/project/project-detail-view';
import type { Tutorial, ChecklistItem } from '@/lib/types/database';

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // 1. Fetch tutorial with strict RLS isolation
  const { data: tutorial, error: tutorialError } = await (supabase.from('tutorials') as any)
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (tutorialError || !tutorial) {
    notFound();
  }

  // 2. Fetch checklist items for this tutorial
  const { data: items, error: itemsError } = await (supabase.from('checklist_items') as any)
    .select('*')
    .eq('tutorial_id', id)
    .order('order_index', { ascending: true });

  if (itemsError) {
    console.error('[ProjectPage] Error fetching checklist items:', itemsError);
  }

  // 3. Generate secure signed URLs for original file preview if available
  let signedUrl: string | null = null;
  let signedUrls: string[] = [];

  if (tutorial.file_path && tutorial.file_path !== 'raw_text') {
    try {
      const adminClient = await createAdminClient();
      const folder = `${user.id}/${id}`;
      const { data: folderFiles } = await adminClient.storage
        .from('tutorial_files')
        .list(folder);

      if (folderFiles && folderFiles.length > 0) {
        const sortedFiles = folderFiles
          .filter((f: any) => f.name && !f.name.startsWith('.'))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));

        const paths = sortedFiles.map((f: any) => `${folder}/${f.name}`);
        const { data: signedList } = await adminClient.storage
          .from('tutorial_files')
          .createSignedUrls(paths, 3600);

        if (signedList && signedList.length > 0) {
          signedUrls = signedList.map((s: any) => s.signedUrl).filter(Boolean);
          signedUrl = signedUrls[0] || null;
        }
      }

      if (!signedUrl) {
        const { data: signedData, error: signedError } = await adminClient.storage
          .from('tutorial_files')
          .createSignedUrl(tutorial.file_path, 3600);

        if (signedError || !signedData?.signedUrl) {
          const fallback = await adminClient.storage
            .from('patterns')
            .createSignedUrl(tutorial.file_path, 3600);
          if (fallback.data?.signedUrl) {
            signedUrl = fallback.data.signedUrl;
            signedUrls = [signedUrl];
          }
        } else {
          signedUrl = signedData.signedUrl;
          signedUrls = [signedUrl];
        }
      }
    } catch (signErr) {
      console.warn('[ProjectPage] Error signing original files:', signErr);
    }
  }

  // 4. Pre-fetch cached translations for instant 0ms switching
  const { data: cachedTranslations } = await (supabase.from('translations') as any)
    .select('target_language, content')
    .eq('tutorial_id', id)
    .eq('status', 'done');

  const initialTranslations: Record<string, any> = {};
  if (cachedTranslations && Array.isArray(cachedTranslations)) {
    cachedTranslations.forEach((t: any) => {
      if (t.target_language && t.content) {
        initialTranslations[t.target_language] = t.content;
      }
    });
  }

  return (
    <ProjectDetailView
      tutorial={tutorial as Tutorial}
      initialItems={(items || []) as ChecklistItem[]}
      signedUrl={signedUrl}
      signedUrls={signedUrls}
      initialTranslations={initialTranslations}
    />
  );
}
