import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkUserUploadQuota } from '@/lib/ai/usage-tracker';
import { NewPatternView } from '@/components/library/new-pattern-view';

export const metadata = {
  title: 'Import a Pattern | Step by Stitch',
  description: 'Upload a PDF pattern, images, or paste raw text to automatically generate an interactive crochet checklist.',
};

export default async function NewPatternPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const quota = await checkUserUploadQuota(user.id);

  return <NewPatternView quota={quota} />;
}
