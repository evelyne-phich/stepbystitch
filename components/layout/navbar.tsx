'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X, Layers, HelpCircle, CreditCard } from 'lucide-react';
import { useAuth } from '@/lib/supabase/hooks';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useI18n } from '@/lib/i18n/context';
import { CrochetLogo } from '@/components/ui/crochet-logo';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useAuth();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-yarn-50/95 border-b border-yarn-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">

          {/* 1. Left: Brand & Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <CrochetLogo size="md" />
              <span className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-yarn-900 group-hover:text-yarn-700 transition-colors whitespace-nowrap">
                {t.common.brandName}
              </span>
            </Link>
          </div>

          {/* 2. Center: Clean & Balanced 4-Item Navigation Links with Icons (Desktop >= 1024px) */}
          <nav className="hidden lg:flex items-center justify-center gap-2 lg:gap-3.5 xl:gap-5 text-sm font-medium text-yarn-700 flex-1 mx-2">
            <Link
              href="/#features"
              className="hover:text-yarn-950 transition-colors py-1 px-2 rounded-lg hover:bg-yarn-100/70 whitespace-nowrap flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4 text-sage-600 flex-shrink-0" />
              <span>{t.common.features}</span>
            </Link>
            <Link
              href="/#demo"
              className="hover:text-yarn-950 transition-colors py-1 px-2 rounded-lg hover:bg-yarn-100/70 whitespace-nowrap flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-sage-600 flex-shrink-0" />
              <span>{t.common.demo}</span>
            </Link>
            <Link
              href="/#tarifs"
              className="hover:text-yarn-950 transition-colors py-1 px-2 rounded-lg hover:bg-yarn-100/70 whitespace-nowrap flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4 text-sage-600 flex-shrink-0" />
              <span>{t.common.pricing}</span>
            </Link>
            <Link
              href="/#faq"
              className="hover:text-yarn-950 transition-colors py-1 px-2 rounded-lg hover:bg-yarn-100/70 whitespace-nowrap flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-sage-600 flex-shrink-0" />
              <span>{t.common.faq}</span>
            </Link>
          </nav>

          {/* 3. Right: Auth / Action Buttons + Language Switcher (Desktop >= 1024px) */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-4 flex-shrink-0">
            <LanguageSwitcher />

            <div className="h-5 w-px bg-yarn-300" />

            {!loading && user ? (
              <Link
                href="/library"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-yarn-900 hover:bg-yarn-950 shadow-soft transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
              >
                <Layers className="w-4 h-4" />
                <span>{t.common.myLibrary}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm font-medium text-yarn-800 hover:text-yarn-950 transition-colors whitespace-nowrap"
                >
                  {t.common.login}
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sage-800 to-sage-600 hover:from-sage-900 hover:to-sage-700 shadow-soft hover:shadow-lift transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                  <span>{t.common.signup}</span>
                </Link>
              </div>
            )}
          </div>

          {/* 4. Mobile & Tablet Menu Button (< 1024px, including 950px, 768px, mobile) */}
          <div className="flex lg:hidden items-center gap-3 flex-shrink-0">
            <LanguageSwitcher />
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="p-2 rounded-xl text-yarn-800 hover:bg-yarn-100 focus:outline-none transition-colors"
              aria-label={t.common.toggleMenu}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-yarn-900" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile & Tablet Drawer (< 1024px) */}
      {isOpen && (
        <div className="lg:hidden border-b border-yarn-200 bg-yarn-50 px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            href="/#features"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-yarn-800 hover:bg-yarn-100 transition-colors"
          >
            <Layers className="w-4 h-4 text-sage-600" />
            <span>{t.common.features}</span>
          </Link>
          <Link
            href="/#demo"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-yarn-800 hover:bg-yarn-100 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-sage-600" />
            <span>{t.common.demo}</span>
          </Link>
          <Link
            href="/#tarifs"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-yarn-800 hover:bg-yarn-100 transition-colors"
          >
            <CreditCard className="w-4 h-4 text-sage-600" />
            <span>{t.common.pricing}</span>
          </Link>
          <Link
            href="/#faq"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-yarn-800 hover:bg-yarn-100 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-sage-600" />
            <span>{t.common.faq}</span>
          </Link>

          <div className="pt-4 mt-2 border-t border-yarn-200 flex flex-col gap-2.5">
            {!loading && user ? (
              <Link
                href="/library"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-3 rounded-xl font-semibold text-white bg-yarn-900 hover:bg-yarn-950 shadow-soft"
              >
                {t.common.myLibrary}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl font-medium text-yarn-800 bg-white border border-yarn-200 hover:bg-yarn-50"
                >
                  {t.common.login}
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sage-800 to-sage-600 shadow-soft"
                >
                  {t.common.createAccount}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
