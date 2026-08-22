'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fr } from './dictionaries/fr';
import { en } from './dictionaries/en';
import { en_uk } from './dictionaries/en_uk';
import { es } from './dictionaries/es';
import { de } from './dictionaries/de';
import { ru } from './dictionaries/ru';
import { pt } from './dictionaries/pt';
import { zh } from './dictionaries/zh';

export type Locale = 'fr' | 'en' | 'en_us' | 'en_uk' | 'es' | 'de' | 'ru' | 'pt' | 'zh';
export type Dictionary = typeof fr;

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
}

export const SITE_LOCALES: LocaleInfo[] = [
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English (US)', nativeName: 'English (US)', flag: '🇺🇸' },
  { code: 'en_uk', name: 'English (UK)', nativeName: 'English (UK)', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
];

const dictionaries: Record<Locale, Dictionary> = {
  fr,
  en,
  en_us: en,
  en_uk,
  es,
  de,
  ru,
  pt,
  zh,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr');

  useEffect(() => {
    // Check saved preference in localStorage or navigator language
    const saved = localStorage.getItem('stepbystitch_locale') as Locale | null;
    if (saved && dictionaries[saved]) {
      setLocaleState(saved);
    } else if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.slice(0, 2).toLowerCase();
      if (browserLang === 'es') setLocaleState('es');
      else if (browserLang === 'de') setLocaleState('de');
      else if (browserLang === 'ru') setLocaleState('ru');
      else if (browserLang === 'pt') setLocaleState('pt');
      else if (browserLang === 'zh') setLocaleState('zh');
      else if (browserLang === 'en') setLocaleState('en');
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('stepbystitch_locale', newLocale);
      document.documentElement.lang = newLocale;
    } catch {}
  };

  const t = dictionaries[locale] || fr;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback to default French dictionary if outside provider
    return {
      locale: 'fr' as Locale,
      setLocale: () => {},
      t: fr,
    };
  }
  return context;
}
