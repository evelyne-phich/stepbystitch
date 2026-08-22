'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, LogOut } from 'lucide-react';
import { logout } from '@/app/(auth)/actions';
import { useI18n } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { CrochetLogo } from '@/components/ui/crochet-logo';

interface DashboardHeaderProps {
  userName?: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const { t } = useI18n();
  const pathname = usePathname();

  // The tutorial reader page is /library/[id] (where id !== 'new')
  const isTutorialPage = pathname?.startsWith('/library/') && pathname !== '/library/new';
  const isImportPage = pathname === '/library/new';

  return (
    <header
      className={`${
        isTutorialPage ? 'relative' : 'sticky top-0 z-50'
      } bg-white/95 backdrop-blur-md border-b border-yarn-200 shadow-soft w-full overflow-hidden transition-all`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* Brand */}
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <Link href="/library" className="flex items-center gap-2 group min-w-0">
              <CrochetLogo size="md" />
              <span className="text-base sm:text-xl font-bold font-serif text-yarn-900 tracking-tight truncate group-hover:text-sage-800 transition-colors">
                {t.common.brandName}
              </span>
            </Link>
          </div>

          {/* Right actions & user profile */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 shrink-0">
            {/* Import Pattern CTA Button (Hidden on /library/new) */}
            {!isImportPage && (
              <Link
                href="/library/new"
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-sage-800 hover:bg-sage-900 shadow-soft hover:shadow-md transition-all duration-300 ease-out shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{t.common.importPattern}</span>
              </Link>
            )}

            <LanguageSwitcher />

            <div className="h-6 w-px bg-yarn-200 hidden sm:block" />

            {/* User avatar badge */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-yarn-200 text-yarn-800 flex items-center justify-center font-bold text-sm">
                {(userName || 'U').charAt(0).toUpperCase()}
              </div>
              {userName && (
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-yarn-900 leading-tight truncate max-w-[140px]">
                    {userName}
                  </span>
                </div>
              )}
            </div>

            {/* Sign out button */}
            <form action={logout}>
              <button
                type="submit"
                title={t.common.logout}
                className="p-2.5 rounded-xl text-yarn-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </header>
  );
}
