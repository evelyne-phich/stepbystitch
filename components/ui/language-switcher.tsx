'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useI18n, type Locale } from '@/lib/i18n/context';
import { Globe } from 'lucide-react';

const ROUTE_TRANSLATIONS: Record<string, { fr: string; en: string }> = {
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

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { t, locale, setLocale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  const handleToggle = () => {
    const nextLocale: Locale = locale === 'fr' ? 'en' : 'fr';
    setLocale(nextLocale);

    // If on a language-specific URL, redirect to the localized URL version
    if (pathname && ROUTE_TRANSLATIONS[pathname]) {
      const targetUrl = ROUTE_TRANSLATIONS[pathname][nextLocale];
      if (targetUrl && targetUrl !== pathname) {
        router.push(targetUrl);
      }
    }
  };

  const titleTooltip = t.common.switchLangTooltip;

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={titleTooltip}
      aria-label={titleTooltip}
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-yarn-100/90 hover:bg-yarn-200/80 border border-yarn-300/80 text-xs font-bold text-yarn-900 transition-all hover:scale-105 active:scale-95 shadow-xs ${className}`}
    >
      <Globe className="w-3.5 h-3.5 text-sage-700 flex-shrink-0" />
      <span className="uppercase tracking-wider">{locale}</span>
    </button>
  );
}
