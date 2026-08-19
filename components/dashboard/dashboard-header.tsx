'use client';

import Link from 'next/link';
import { Layers, Plus, LogOut } from 'lucide-react';
import { logout } from '@/app/(auth)/actions';
import { useI18n } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { CrochetLogo } from '@/components/ui/crochet-logo';

interface DashboardHeaderProps {
  userName: string;
  userLang: string;
}

export function DashboardHeader({ userName, userLang }: DashboardHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-yarn-200 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href="/library" className="flex items-center gap-2.5 group">
              <CrochetLogo size="md" />
              <span className="text-xl font-bold font-serif text-yarn-900 tracking-tight whitespace-nowrap">
                {t.common.brandName}
              </span>
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/library"
                className="px-3.5 py-2 rounded-xl text-sm font-semibold text-yarn-900 bg-yarn-100/80 flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-yarn-700" />
                <span>{t.common.myPatterns}</span>
              </Link>
            </nav>
          </div>

          {/* Right actions & user profile */}
          <div className="flex items-center gap-4 lg:gap-6">
            <LanguageSwitcher />

            <div className="h-6 w-px bg-yarn-200 hidden sm:block" />

            <Link
              href="/library/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-sage-800 to-sage-600 hover:from-sage-900 hover:to-sage-700 shadow-soft hover:shadow-lift transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t.common.importPattern}</span>
              <span className="sm:hidden">{t.common.importPattern.split(' ')[0]}</span>
            </Link>

            {/* User avatar badge */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-yarn-200 text-yarn-800 flex items-center justify-center font-bold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-yarn-900 leading-tight">
                  {userName}
                </span>
                <span className="text-[11px] text-yarn-500 uppercase">
                  {t.library.langPrefix}: {userLang.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Sign out button */}
            <form action={logout}>
              <button
                type="submit"
                title={t.common.logout}
                className="p-2.5 rounded-xl text-yarn-500 hover:text-red-600 hover:bg-red-50 transition-colors"
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
