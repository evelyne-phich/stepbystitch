'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/lib/i18n/context';
import { X, Search, BookOpen } from 'lucide-react';

import { en } from '@/lib/i18n/dictionaries/en';
import { fr } from '@/lib/i18n/dictionaries/fr';

export interface StitchGlossaryItem {
  keyFr: string;
  titleFr: string;
  descFr: string;
  keyEn: string;
  titleEn: string;
  descEn: string;
  extraEn?: string;
}

export const GLOSSARY_ITEMS: StitchGlossaryItem[] = [
  // --- Points de base ---
  {
    keyFr: 'ms',
    titleFr: 'Maille serrée (ms)',
    descFr: 'Point de base incontournable : dense, régulier et sans trou, idéal pour les amigurumis et les pièces structurées.',
    keyEn: 'sc',
    titleEn: 'Single Crochet (sc)',
    descEn: 'Fundamental dense, tight stitch standard for amigurumi and structured projects.',
    extraEn: '🇬🇧 UK : Double Crochet (dc)',
  },
  {
    keyFr: 'ml',
    titleFr: "Maille en l'air (ml)",
    descFr: 'Point de départ pour monter une chaînette de base ou donner de la hauteur au début d’un nouveau rang.',
    keyEn: 'ch',
    titleEn: 'Chain Stitch (ch)',
    descEn: 'Foundation stitch used to begin a project or build row height.',
  },
  {
    keyFr: 'mc',
    titleFr: 'Maille coulée (mc)',
    descFr: 'Sert à fermer un tour de manière invisible ou à déplacer le fil de travail discrètement le long des mailles.',
    keyEn: 'sl st',
    titleEn: 'Slip Stitch (sl st)',
    descEn: 'Used to join rounds seamlessly or move working yarn invisibly across stitches.',
  },
  {
    keyFr: 'db',
    titleFr: 'Demi-bride (db)',
    descFr: 'Point de hauteur intermédiaire apportant souplesse, douceur et une texture légèrement côtelée.',
    keyEn: 'hdc',
    titleEn: 'Half Double Crochet (hdc)',
    descEn: 'Medium-height stitch providing flexibility, softness and textured ribbing.',
    extraEn: '🇬🇧 UK : Half Treble Crochet (htr)',
  },
  {
    keyFr: 'br',
    titleFr: 'Bride (br)',
    descFr: 'Point aéré, haut et très souple, particulièrement apprécié pour les vêtements, châles et plaids.',
    keyEn: 'dc',
    titleEn: 'Double Crochet (dc)',
    descEn: 'Classic tall openwork stitch, popular for garments, shawls, and blankets.',
    extraEn: '🇬🇧 UK : Treble Crochet (tr)',
  },

  // --- Augmentations & Diminutions ---
  {
    keyFr: 'aug',
    titleFr: 'Augmentation (aug)',
    descFr: 'Crocheter 2 mailles dans la même maille du rang précédent pour élargir l’ouvrage et augmenter le tour.',
    keyEn: 'inc',
    titleEn: 'Increase (inc)',
    descEn: 'Work 2 stitches into the same stitch of the previous round to widen the piece.',
  },
  {
    keyFr: 'dim',
    titleFr: 'Diminution (dim)',
    descFr: 'Écouler 2 mailles ensemble pour resserrer le tour et réduire le nombre total de mailles (diminution invisible recommandée pour les amigurumis).',
    keyEn: 'dec',
    titleEn: 'Decrease (dec)',
    descEn: 'Work 2 stitches together (e.g. sc2tog or invisible decrease) to reduce the round circumference.',
  },

  // --- Cercles & Spécial ---
  {
    keyFr: 'CM',
    titleFr: 'Cercle magique (CM)',
    descFr: 'Boucle ajustable coulissante pour démarrer un ouvrage en rond en resserrant le centre afin de ne laisser aucun trou.',
    keyEn: 'MR',
    titleEn: 'Magic Ring (MR)',
    descEn: 'Adjustable sliding loop used to start crocheting in the round with zero center hole.',
  },
  {
    keyFr: 'm',
    titleFr: 'Maille (m)',
    descFr: 'Désigne une maille individuelle quelconque du rang ou du tour.',
    keyEn: 'st',
    titleEn: 'Stitch (st)',
    descEn: 'Refers to an individual stitch within the current round or row.',
  },
];

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
}

export function GlossaryModal({ isOpen, onClose, language }: GlossaryModalProps) {
  const { t: appDict, locale } = useI18n();
  const isFr = language ? language === 'fr' : locale === 'fr';
  const t = language ? (language === 'fr' ? fr : en) : (locale === 'en' ? en : appDict);

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

      const key = (isFr ? item.keyFr : item.keyEn).toLowerCase();
      const title = (isFr ? item.titleFr : item.titleEn).toLowerCase();
      const desc = (isFr ? item.descFr : item.descEn).toLowerCase();

      return key.includes(query) || title.includes(query) || desc.includes(query);
    });
  }, [searchQuery, isFr]);

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

      {/* Modal / Mobile Drawer Card (Fixed height, smooth slide up transition on mobile) */}
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
              <h2 className="text-base sm:text-xl font-bold font-serif text-yarn-950">
                {t.project.glossaryTitle}
              </h2>
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

        {/* Scrollable Content Body (Fixed height flex container) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3 divide-y divide-yarn-100">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-yarn-500 space-y-2">
              <BookOpen className="w-8 h-8 text-yarn-300 mx-auto" />
              <p className="text-sm font-medium">{t.project.glossaryNoResults}</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const displayKey = isFr ? item.keyFr : item.keyEn;
              const displayTitle = isFr ? item.titleFr : item.titleEn;
              const displayDesc = isFr ? item.descFr : item.descEn;

              return (
                <div
                  key={displayKey}
                  className={`pt-3 ${idx === 0 ? 'pt-0' : ''} space-y-1.5`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono font-bold text-xs shadow-2xs">
                        {displayKey}
                      </span>
                      <h3 className="font-bold text-yarn-950 text-sm sm:text-base">
                        {displayTitle}
                      </h3>
                    </div>

                    {!isFr && item.extraEn && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-yarn-100 text-yarn-700 border border-yarn-200">
                        {item.extraEn}
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
