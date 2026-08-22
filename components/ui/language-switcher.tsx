'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useI18n, type Locale, SITE_LOCALES } from '@/lib/i18n/context';
import { ChevronDown, Check } from 'lucide-react';

const ROUTE_TRANSLATIONS: Record<string, Record<string, string>> = {
  '/guide-abbreviations-crochet': {
    fr: '/guide-abbreviations-crochet',
    en: '/crochet-abbreviations-guide',
  },
  '/crochet-abbreviations-guide': {
    fr: '/guide-abbreviations-crochet',
    en: '/crochet-abbreviations-guide',
  },
  '/comment-traduire-patron-crochet': {
    fr: '/comment-traduire-patron-crochet',
    en: '/how-to-translate-crochet-patterns',
  },
  '/how-to-translate-crochet-patterns': {
    fr: '/comment-traduire-patron-crochet',
    en: '/how-to-translate-crochet-patterns',
  },
};

export function LanguageSwitcher({
  className = '',
  dropUp = false,
}: {
  className?: string;
  dropUp?: boolean;
}) {
  const { t, locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Find active locale info
  const activeLocaleInfo = SITE_LOCALES.find((l) => l.code === locale) || SITE_LOCALES[0];

  const handleSelect = (targetLocale: Locale) => {
    setLocale(targetLocale);
    setIsOpen(false);

    // If on a language-specific URL, redirect to localized route if defined
    if (pathname && ROUTE_TRANSLATIONS[pathname]) {
      const targetUrl =
        ROUTE_TRANSLATIONS[pathname][targetLocale] ||
        ROUTE_TRANSLATIONS[pathname]['en'] ||
        ROUTE_TRANSLATIONS[pathname]['fr'];
      if (targetUrl && targetUrl !== pathname) {
        router.push(targetUrl);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const titleTooltip = t.common.switchLangTooltip;

  return (
    <div className={`relative inline-block text-left z-50 ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={titleTooltip}
        aria-label={titleTooltip}
        aria-expanded={isOpen}
        className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-yarn-100 hover:bg-yarn-200 border border-yarn-300 text-xs font-bold text-yarn-900 transition-all hover:scale-102 active:scale-98 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-sage-500"
      >
        <span className="text-sm leading-none">{activeLocaleInfo.flag}</span>
        <span className="uppercase tracking-wider font-mono text-[11px] font-bold">
          {activeLocaleInfo.code === 'en_us'
            ? 'US'
            : activeLocaleInfo.code === 'en_uk'
            ? 'UK'
            : activeLocaleInfo.code}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-yarn-600 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-yarn-900' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[90] bg-transparent"
            onClick={() => setIsOpen(false)}
          />

          {/* Floating Menu - Solid Opaque White with Clean List */}
          <div
            className={`absolute right-0 ${
              dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            } w-44 rounded-2xl bg-white border border-yarn-200 shadow-2xl p-1 z-[100] animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/10`}
          >
            <div className="max-h-72 overflow-y-auto space-y-0.5 custom-scrollbar">
              {SITE_LOCALES.map((lang) => {
                const isSelected =
                  lang.code === locale || (locale === 'en' && lang.code === 'en_us');
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left cursor-pointer rounded-xl ${
                      isSelected
                        ? 'bg-sage-100 text-sage-950 font-bold'
                        : 'text-yarn-800 hover:bg-yarn-50 hover:text-yarn-950 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base leading-none shrink-0">{lang.flag}</span>
                      <span className="truncate">{lang.nativeName}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sage-700 shrink-0 ml-1.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
