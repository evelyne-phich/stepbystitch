import { createClient } from '@/lib/supabase/server';
import { LibraryView } from '@/components/dashboard/library-view';
import type { Tutorial } from '@/lib/types/database';

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let tutorials: Tutorial[] = [];

  if (user) {
    const { data } = await supabase
      .from('tutorials')
      .select('*')
      .order('saved_at', { ascending: false });
    
    if (data) {
      tutorials = data as Tutorial[];
    }
  }

  return <LibraryView initialTutorials={tutorials} />;
}
