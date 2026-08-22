'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/lib/i18n/context';
import { X, Search, BookOpen } from 'lucide-react';
import { en } from '@/lib/i18n/dictionaries/en';
import { fr } from '@/lib/i18n/dictionaries/fr';

export interface StitchGlossaryItem {
  id: string;
  abbreviations: Record<string, { key: string; name: string }>;
  descFr: string;
  descEn: string;
}

export const GLOSSARY_ITEMS: StitchGlossaryItem[] = [
  // 1. Maille serrée / Single Crochet / Punto Bajo
  {
    id: 'sc',
    abbreviations: {
      fr: { key: 'ms', name: 'Maille serrée' },
      es: { key: 'pb', name: 'Punto bajo / Medio punto' },
      en_us: { key: 'sc', name: 'Single Crochet' },
      en_uk: { key: 'dc', name: 'Double Crochet (UK)' },
      en: { key: 'sc', name: 'Single Crochet' },
      de: { key: 'fM', name: 'Feste Masche' },
      pt: { key: 'pb', name: 'Ponto baixo' },
      ru: { key: 'сбн', name: 'Столбик без накида' },
      zh: { key: 'X', name: '短针' },
    },
    descFr: 'Point de base incontournable : dense, régulier et sans trou, idéal pour les amigurumis et les pièces structurées.',
    descEn: 'Fundamental dense, tight stitch standard for amigurumi and structured crochet projects.',
  },

  // 2. Augmentation / Increase / Aumento
  {
    id: 'inc',
    abbreviations: {
      fr: { key: 'aug', name: 'Augmentation' },
      es: { key: 'aum', name: 'Aumento' },
      en_us: { key: 'inc', name: 'Increase' },
      en_uk: { key: 'inc', name: 'Increase' },
      en: { key: 'inc', name: 'Increase' },
      de: { key: 'Zun', name: 'Zunahme' },
      pt: { key: 'aum', name: 'Aumento' },
      ru: { key: 'пр', name: 'Прибавка' },
      zh: { key: 'V', name: '加针' },
    },
    descFr: 'Crocheter 2 mailles dans la même maille du rang précédent pour élargir l’ouvrage et augmenter le tour.',
    descEn: 'Work 2 stitches into the same stitch of the previous round to widen the piece.',
  },

  // 3. Diminution / Decrease / Disminución
  {
    id: 'dec',
    abbreviations: {
      fr: { key: 'dim', name: 'Diminution' },
      es: { key: 'dism', name: 'Disminución' },
      en_us: { key: 'dec', name: 'Decrease' },
      en_uk: { key: 'dec', name: 'Decrease' },
      en: { key: 'dec', name: 'Decrease' },
      de: { key: 'Abn', name: 'Abnahme' },
      pt: { key: 'dim', name: 'Diminuição' },
      ru: { key: 'уб', name: 'Убавка' },
      zh: { key: 'A', name: '减针' },
    },
    descFr: 'Écouler 2 mailles ensemble pour resserrer le tour et réduire le nombre total de mailles (diminution invisible conseillée pour les amigurumis).',
    descEn: 'Work 2 stitches together (e.g. invisible decrease) to reduce the round circumference.',
  },

  // 4. Cercle magique / Magic Ring / Anillo Mágico
  {
    id: 'mr',
    abbreviations: {
      fr: { key: 'CM', name: 'Cercle magique' },
      es: { key: 'am', name: 'Anillo mágico' },
      en_us: { key: 'MR', name: 'Magic Ring' },
      en_uk: { key: 'MR', name: 'Magic Ring' },
      en: { key: 'MR', name: 'Magic Ring' },
      de: { key: 'MR', name: 'Fadenring / Magischer Ring' },
      pt: { key: 'am', name: 'Anel mágico' },
      ru: { key: 'КА', name: 'Кольцо амигуруми' },
      zh: { key: 'MR', name: '环形起针 / 起针环' },
    },
    descFr: 'Boucle ajustable coulissante pour démarrer un ouvrage en rond en resserrant le centre afin de ne laisser aucun trou.',
    descEn: 'Adjustable sliding loop used to start crocheting in the round with zero center hole.',
  },

  // 5. Maille coulée / Slip Stitch / Punto Enano
  {
    id: 'slst',
    abbreviations: {
      fr: { key: 'mc', name: 'Maille coulée' },
      es: { key: 'pe', name: 'Punto enano / deslizado' },
      en_us: { key: 'sl st', name: 'Slip Stitch' },
      en_uk: { key: 'ss', name: 'Slip Stitch' },
      en: { key: 'sl st', name: 'Slip Stitch' },
      de: { key: 'KM', name: 'Kettmasche' },
      pt: { key: 'pbx', name: 'Ponto baixíssimo' },
      ru: { key: 'сс', name: 'Соединительный столбик' },
      zh: { key: 'SL', name: '引拔针' },
    },
    descFr: 'Sert à fermer un tour de manière invisible ou à déplacer le fil de travail discrètement le long des mailles.',
    descEn: 'Used to join rounds seamlessly or move working yarn invisibly across stitches.',
  },

  // 6. Maille en l'air / Chain / Cadena
  {
    id: 'ch',
    abbreviations: {
      fr: { key: 'ml', name: "Maille en l'air" },
      es: { key: 'cad', name: 'Cadena / Cadeneta' },
      en_us: { key: 'ch', name: 'Chain Stitch' },
      en_uk: { key: 'ch', name: 'Chain Stitch' },
      en: { key: 'ch', name: 'Chain Stitch' },
      de: { key: 'Lm', name: 'Luftmasche' },
      pt: { key: 'corr', name: 'Correntinha' },
      ru: { key: 'вп', name: 'Воздушная петля' },
      zh: { key: 'CH', name: '锁针 / 辫子针' },
    },
    descFr: 'Point de départ pour monter une chaînette de base ou donner de la hauteur au début d’un nouveau rang.',
    descEn: 'Foundation stitch used to begin a project or build row height.',
  },

  // 7. Demi-bride / Half Double / Medio Punto Alto
  {
    id: 'hdc',
    abbreviations: {
      fr: { key: 'db', name: 'Demi-bride' },
      es: { key: 'mpa', name: 'Medio punto alto' },
      en_us: { key: 'hdc', name: 'Half Double Crochet' },
      en_uk: { key: 'htr', name: 'Half Treble Crochet (UK)' },
      en: { key: 'hdc', name: 'Half Double Crochet' },
      de: { key: 'hStb', name: 'Halbes Stäbchen' },
      pt: { key: 'mpa', name: 'Meio ponto alto' },
      ru: { key: 'пссн', name: 'Полустолбик с накидом' },
      zh: { key: 'T', name: '中长针' },
    },
    descFr: 'Point de hauteur intermédiaire apportant souplesse, douceur et une texture légèrement côtelée.',
    descEn: 'Medium-height stitch providing flexibility, softness and textured ribbing.',
  },

  // 8. Bride / Double Crochet / Punto Alto
  {
    id: 'dc',
    abbreviations: {
      fr: { key: 'br', name: 'Bride' },
      es: { key: 'pa', name: 'Punto alto' },
      en_us: { key: 'dc', name: 'Double Crochet' },
      en_uk: { key: 'tr', name: 'Treble Crochet (UK)' },
      en: { key: 'dc', name: 'Double Crochet' },
      de: { key: 'Stb', name: 'Stäbchen' },
      pt: { key: 'pa', name: 'Ponto alto' },
      ru: { key: 'ссн', name: 'Столбик с накидом' },
      zh: { key: 'F', name: '长针' },
    },
    descFr: 'Point aéré, haut et très souple, particulièrement apprécié pour les vêtements, châles et plaids.',
    descEn: 'Classic tall openwork stitch, popular for garments, shawls, and blankets.',
  },

  // 9. Brin arrière uniquement / Back Loop Only / Hebra Trasera
  {
    id: 'blo',
    abbreviations: {
      fr: { key: 'BAR', name: 'Brin arrière uniquement' },
      es: { key: 'HT', name: 'Hebra trasera (BLO)' },
      en_us: { key: 'BLO', name: 'Back Loop Only' },
      en_uk: { key: 'BLO', name: 'Back Loop Only' },
      en: { key: 'BLO', name: 'Back Loop Only' },
      de: { key: 'BLO', name: 'Nur hinteres Maschenglied' },
      pt: { key: 'BLO', name: 'Alças de trás' },
      ru: { key: 'ЗСП', name: 'За заднюю стенку петли' },
      zh: { key: 'BLO', name: '内半针 / 仅后半针' },
    },
    descFr: 'Piquer uniquement sous le brin arrière de la maille pour créer une jolie nervure en relief.',
    descEn: 'Insert hook into back loop only to create a distinct decorative horizontal ridge.',
  },

  // 10. Brin avant uniquement / Front Loop Only / Hebra Delantera
  {
    id: 'flo',
    abbreviations: {
      fr: { key: 'BAV', name: 'Brin avant uniquement' },
      es: { key: 'HD', name: 'Hebra delantera (FLO)' },
      en_us: { key: 'FLO', name: 'Front Loop Only' },
      en_uk: { key: 'FLO', name: 'Front Loop Only' },
      en: { key: 'FLO', name: 'Front Loop Only' },
      de: { key: 'FLO', name: 'Nur vorderes Maschenglied' },
      pt: { key: 'FLO', name: 'Alças da frente' },
      ru: { key: 'ПСП', name: 'За переднюю стенку петли' },
      zh: { key: 'FLO', name: '外半针 / 仅前半针' },
    },
    descFr: 'Piquer uniquement sous le brin avant de la maille du tour précédent.',
    descEn: 'Insert hook into front loop only of the stitch from the previous round.',
  },
];

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
}

export function GlossaryModal({ isOpen, onClose, language }: GlossaryModalProps) {
  const { t: appDict, locale } = useI18n();
  const patternLang = language || locale || 'fr';
  const isFr = locale === 'fr';
  const t = locale === 'en' ? en : appDict;

  const [searchQuery, setSearchQuery] = useState('');

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return GLOSSARY_ITEMS.filter((item) => {
      if (!query) return true;

      // Search across all languages and descriptions
      const abbrValues = Object.values(item.abbreviations).map(
        (a) => `${a.key} ${a.name}`.toLowerCase()
      );
      const desc = `${item.descFr} ${item.descEn}`.toLowerCase();

      return (
        abbrValues.some((v) => v.includes(query)) ||
        desc.includes(query)
      );
    });
  }, [searchQuery]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-yarn-950/65 backdrop-blur-xs animate-backdrop-fade transition-opacity"
      />

      {/* Modal / Mobile Drawer Card */}
      <div className="relative w-full sm:max-w-2xl h-[82vh] sm:h-[580px] bg-white rounded-t-[28px] sm:rounded-3xl border-t sm:border border-yarn-200 shadow-2xl overflow-hidden flex flex-col z-10 animate-drawer-slide-up sm:animate-modal-zoom">
        {/* Modal / Drawer Header */}
        <div className="p-4 sm:p-6 border-b border-yarn-100 bg-gradient-to-br from-yarn-50 via-white to-sage-50/40 shrink-0">
          {/* Mobile Handle Bar */}
          <div className="w-10 h-1 rounded-full bg-yarn-300 mx-auto mb-3 sm:hidden shrink-0" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-sage-100 border border-sage-200 flex items-center justify-center text-sage-800 shrink-0 shadow-2xs">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-bold font-serif text-yarn-950">
                  {t.project.glossaryTitle}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-yarn-100 hover:bg-yarn-200 text-yarn-700 hover:text-yarn-950 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="mt-3.5 relative">
            <Search className="w-4 h-4 text-yarn-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.project.glossarySearchPlaceholder}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-2xl border border-yarn-300 text-xs sm:text-sm focus:ring-2 focus:ring-sage-500 focus:outline-none bg-white text-yarn-900 shadow-2xs placeholder:text-yarn-400"
            />
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3 divide-y divide-yarn-100">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-yarn-500 space-y-2">
              <BookOpen className="w-8 h-8 text-yarn-300 mx-auto" />
              <p className="text-sm font-medium">{t.project.glossaryNoResults}</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const activeAbbr =
                item.abbreviations[patternLang] ||
                item.abbreviations.en_us ||
                item.abbreviations.fr;

              const primaryKey = activeAbbr.key;
              const primaryName = activeAbbr.name;
              const displayDesc = isFr ? item.descFr : item.descEn;

              // Compute the single conversion badge matching the site language:
              const frKey = item.abbreviations.fr?.key;
              const usKey = item.abbreviations.en_us?.key;
              const ukKey = item.abbreviations.en_uk?.key;

              let conversionBadge: { flag: string; key: string; label: string } | null = null;

              if (locale === 'fr') {
                if (patternLang !== 'fr' && frKey) {
                  conversionBadge = { flag: '🇫🇷', key: frKey, label: item.abbreviations.fr.name };
                } else if (patternLang === 'fr' && usKey) {
                  conversionBadge = { flag: '🇺🇸', key: usKey, label: item.abbreviations.en_us.name };
                }
              } else {
                // English site locale
                if (patternLang === 'en_uk' && usKey) {
                  conversionBadge = { flag: '🇺🇸', key: usKey, label: 'US equivalent' };
                } else if ((patternLang === 'en_us' || patternLang === 'en') && ukKey) {
                  conversionBadge = { flag: '🇬🇧', key: ukKey, label: 'UK equivalent' };
                } else if (usKey) {
                  conversionBadge = { flag: '🇺🇸', key: usKey, label: item.abbreviations.en_us.name };
                }
              }

              return (
                <div
                  key={item.id}
                  className={`pt-3.5 ${idx === 0 ? 'pt-0' : ''} space-y-1.5`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono font-bold text-xs shadow-2xs">
                        {primaryKey}
                      </span>
                      <h3 className="font-bold text-yarn-950 text-sm sm:text-base">
                        {primaryName}
                      </h3>
                    </div>

                    {/* Single Clean Conversion Badge for the site language */}
                    {conversionBadge && (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-yarn-100/90 hover:bg-yarn-200/80 text-yarn-800 border border-yarn-200/90 font-mono text-xs font-semibold transition-colors shadow-2xs"
                        title={conversionBadge.label}
                      >
                        <span>{conversionBadge.flag}</span>
                        <span>{conversionBadge.key}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-yarn-700 leading-relaxed">
                    {displayDesc}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
