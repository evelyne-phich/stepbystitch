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
  const { locale, setLocale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  const handleSwitch = (newLocale: Locale) => {
    setLocale(newLocale);

    // If on a language-specific URL, redirect to the localized URL version
    if (pathname && ROUTE_TRANSLATIONS[pathname]) {
      const targetUrl = ROUTE_TRANSLATIONS[pathname][newLocale];
      if (targetUrl && targetUrl !== pathname) {
        router.push(targetUrl);
      }
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yarn-100/90 border border-yarn-300/80 text-xs font-medium text-yarn-800 ${className}`}>
      <Globe className="w-3.5 h-3.5 text-yarn-600" />
      <button
        type="button"
        onClick={() => handleSwitch('fr')}
        className={`px-1.5 py-0.5 rounded transition-all ${
          locale === 'fr'
            ? 'font-bold bg-white text-yarn-950 shadow-xs'
            : 'text-yarn-600 hover:text-yarn-900'
        }`}
      >
        FR
      </button>
      <span className="text-yarn-300">|</span>
      <button
        type="button"
        onClick={() => handleSwitch('en')}
        className={`px-1.5 py-0.5 rounded transition-all ${
          locale === 'en'
            ? 'font-bold bg-white text-yarn-950 shadow-xs'
            : 'text-yarn-600 hover:text-yarn-900'
        }`}
      >
        EN
      </button>
    </div>
  );
}
