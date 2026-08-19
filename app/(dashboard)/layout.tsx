import { createClient } from '@/lib/supabase/server';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userName = user?.user_metadata?.full_name
  const userLang = user?.user_metadata?.langue_preferee || 'fr';

  return (
    <div className="min-h-screen flex flex-col bg-yarn-50">
      <DashboardHeader userName={userName} userLang={userLang} />

      {/* Main dashboard container */}
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
