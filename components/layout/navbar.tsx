'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X, ArrowRight, Layers, BookOpen, HelpCircle, CreditCard } from 'lucide-react';
import { useAuth } from '@/lib/supabase/hooks';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useI18n } from '@/lib/i18n/context';
import { CrochetLogo } from '@/components/ui/crochet-logo';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useAuth();
  const { t, locale } = useI18n();

  const abbreviationsHref = locale === 'fr' ? '/guide-abbreviations-crochet' : '/crochet-abbreviations-guide';

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-yarn-50/90 border-b border-yarn-200/70 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 xl:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 xl:gap-4">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <CrochetLogo size="md" />
            <span className="text-xl xl:text-2xl font-bold font-serif tracking-tight text-yarn-900 group-hover:text-yarn-700 transition-colors whitespace-nowrap">
              {t.common.brandName}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-6 2xl:gap-8 text-sm font-medium text-yarn-700 whitespace-nowrap">
            <Link href="/#features" className="hover:text-yarn-900 transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <Layers className="w-4 h-4 text-sage-600 flex-shrink-0" />
              <span>{t.common.features}</span>
            </Link>
            <Link href="/#demo" className="hover:text-yarn-900 transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <Sparkles className="w-4 h-4 text-sage-600 flex-shrink-0" />
              <span>{t.common.interactiveDemo}</span>
            </Link>
            <Link href="/#tarifs" className="hover:text-yarn-900 transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <CreditCard className="w-4 h-4 text-sage-600 flex-shrink-0" />
              <span>{t.common.pricing}</span>
            </Link>
            <Link href={abbreviationsHref} className="hover:text-yarn-900 transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <BookOpen className="w-4 h-4 text-sage-600 flex-shrink-0" />
              <span>{t.common.abbreviationsGuide}</span>
            </Link>
            <Link href="/#faq" className="hover:text-yarn-900 transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <HelpCircle className="w-4 h-4 text-sage-600 flex-shrink-0" />
              <span>{t.common.faq}</span>
            </Link>
          </nav>

          {/* Desktop CTA / Auth buttons + Language Switcher */}
          <div className="hidden lg:flex items-center gap-2.5 xl:gap-4 2xl:gap-5 flex-shrink-0 whitespace-nowrap pl-1 xl:pl-4">
            <LanguageSwitcher />

            <div className="h-5 w-px bg-yarn-300 hidden sm:block" />

            {!loading && user ? (
              <Link
                href="/library"
                className="inline-flex items-center gap-2 px-4 py-2 xl:px-5 xl:py-2.5 rounded-full text-sm font-semibold text-white bg-yarn-800 hover:bg-yarn-900 shadow-soft transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
              >
                <Layers className="w-4 h-4" />
                <span>{t.common.myLibrary}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2.5 xl:gap-3 2xl:gap-4 whitespace-nowrap">
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm font-medium text-yarn-800 hover:text-yarn-950 transition-colors whitespace-nowrap"
                >
                  {t.common.login}
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-4 py-2 xl:px-5 xl:py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-sage-800 to-sage-600 hover:from-sage-900 hover:to-sage-700 shadow-soft hover:shadow-lift transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                  <span className="whitespace-nowrap">{t.common.signup}</span>
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile & Tablet menu button (Active on < lg) */}
          <div className="flex lg:hidden items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="p-2 rounded-xl text-yarn-700 hover:bg-yarn-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet menu dropdown (< lg) */}
      {isOpen && (
        <div className="lg:hidden border-b border-yarn-200 bg-yarn-50 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <Link
            href="/#features"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-base font-medium text-yarn-800 hover:bg-yarn-100"
          >
            <Layers className="w-4 h-4 text-sage-600" />
            <span>{t.common.features}</span>
          </Link>
          <Link
            href="/#demo"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-base font-medium text-yarn-800 hover:bg-yarn-100"
          >
            <Sparkles className="w-4 h-4 text-sage-600" />
            <span>{t.common.interactiveDemo}</span>
          </Link>
          <Link
            href="/#tarifs"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-base font-medium text-yarn-800 hover:bg-yarn-100"
          >
            <CreditCard className="w-4 h-4 text-sage-600" />
            <span>{t.common.pricing}</span>
          </Link>
          <Link
            href={abbreviationsHref}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-base font-medium text-yarn-800 hover:bg-yarn-100"
          >
            <BookOpen className="w-4 h-4 text-sage-600" />
            <span>{t.common.abbreviationsGuide}</span>
          </Link>
          <Link
            href="/#faq"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-base font-medium text-yarn-800 hover:bg-yarn-100"
          >
            <HelpCircle className="w-4 h-4 text-sage-600" />
            <span>{t.common.faq}</span>
          </Link>
          
          <div className="pt-4 border-t border-yarn-200 flex flex-col gap-2">
            {!loading && user ? (
              <Link
                href="/library"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-3 rounded-xl font-semibold text-white bg-yarn-800 hover:bg-yarn-900"
              >
                {t.common.myLibrary}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl font-medium text-yarn-800 hover:bg-yarn-100"
                >
                  {t.common.login}
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sage-800 to-sage-600"
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
