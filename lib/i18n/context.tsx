'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from './dictionaries/en';
import { fr } from './dictionaries/fr';

export type Locale = 'en' | 'fr';
export type Dictionary = typeof en;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const dictionaries: Record<Locale, Dictionary> = {
  en,
  fr,
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr');

  useEffect(() => {
    // Check saved preference in localStorage or navigator language
    const saved = localStorage.getItem('stepbystitch_locale') as Locale | null;
    if (saved && (saved === 'en' || saved === 'fr')) {
      setLocaleState(saved);
    } else if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.slice(0, 2);
      if (browserLang === 'en') {
        setLocaleState('en');
      }
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
