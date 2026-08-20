import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
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

  // 3. Generate secure signed URL for original file preview if available
  let signedUrl: string | null = null;
  if (tutorial.file_path && tutorial.file_path !== 'raw_text') {
    let { data: signedData, error: signedError } = await supabase.storage
      .from('tutorial_files')
      .createSignedUrl(tutorial.file_path, 3600);

    if (signedError || !signedData?.signedUrl) {
      const fallback = await supabase.storage
        .from('patterns')
        .createSignedUrl(tutorial.file_path, 3600);
      if (fallback.data?.signedUrl) {
        signedUrl = fallback.data.signedUrl;
      } else {
        console.warn('[ProjectPage] Could not generate signed URL:', signedError?.message || fallback.error?.message);
      }
    } else {
      signedUrl = signedData.signedUrl;
    }
  }

  return (
    <ProjectDetailView
      tutorial={tutorial as Tutorial}
      initialItems={(items || []) as ChecklistItem[]}
      signedUrl={signedUrl}
    />
  );
}
