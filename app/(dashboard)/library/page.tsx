import { createClient } from '@/lib/supabase/server';
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
      .select('*, checklist_items(id, checked)')
      .order('saved_at', { ascending: false });
    
    if (error) {
      console.error('[LibraryPage] Error fetching tutorials with checklist_items:', error);
    }

    if (tutorialsData && tutorialsData.length > 0) {
      tutorials = tutorialsData.map((t: any) => {
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
        };
      });
    }
  }

  return <LibraryView initialTutorials={tutorials} />;
}
