'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';

interface StitchDefinition {
  titleFr: string;
  descFr: string;
  titleEn: string;
  descEn: string;
  extraEn?: string; // Optional UK vs US note for English users
}

const STITCH_DEFINITIONS: Record<string, StitchDefinition> = {
  // --- Single Crochet / Maille Serrée ---
  ms: {
    titleFr: 'Maille serrée',
    descFr: 'Point de base dense, régulier et sans trou, idéal pour les amigurumis et pièces structurées.',
    titleEn: 'Single Crochet (US)',
    descEn: 'Basic dense, tight stitch standard for amigurumi and structured projects.',
    extraEn: '🇬🇧 UK equivalent: Double Crochet (dc)',
  },
  sc: {
    titleFr: 'Maille serrée (sc)',
    descFr: 'Abréviation anglaise (US) pour Single Crochet. Correspond à la maille serrée (ms).',
    titleEn: 'Single Crochet',
    descEn: 'Standard dense, tight stitch for amigurumi and structured projects.',
    extraEn: '🇬🇧 UK equivalent: Double Crochet (dc)',
  },

  // --- Increase / Augmentation ---
  aug: {
    titleFr: 'Augmentation',
    descFr: 'Crocheter 2 mailles dans la même maille du rang précédent pour élargir l’ouvrage.',
    titleEn: 'Increase',
    descEn: 'Work 2 stitches into the same stitch of the previous row to widen the project.',
  },
  inc: {
    titleFr: 'Augmentation (inc)',
    descFr: 'Abréviation anglaise pour Increase (augmentation : 2 ms dans la même maille).',
    titleEn: 'Increase',
    descEn: 'Work 2 stitches into the same stitch of the previous row to expand the round.',
  },

  // --- Decrease / Diminution ---
  dim: {
    titleFr: 'Diminution',
    descFr: 'Écouler 2 mailles ensemble pour resserrer le tour et réduire le nombre de mailles.',
    titleEn: 'Decrease',
    descEn: 'Work 2 stitches together (e.g. sc2tog) to reduce the total stitch count.',
  },
  dec: {
    titleFr: 'Diminution (dec)',
    descFr: 'Abréviation anglaise pour Decrease (diminution : 2 mailles rabattues ensemble).',
    titleEn: 'Decrease',
    descEn: 'Work 2 stitches together (e.g. sc2tog) to decrease the round circumference.',
  },

  // --- Magic Ring / Cercle Magique ---
  CM: {
    titleFr: 'Cercle magique',
    descFr: 'Boucle ajustable pour commencer un ouvrage en rond sans laisser de trou au centre.',
    titleEn: 'Magic Ring (MR)',
    descEn: 'Adjustable loop used to start crocheting in the round with no center hole.',
  },
  'cercle magique': {
    titleFr: 'Cercle magique (CM)',
    descFr: 'Boucle ajustable pour commencer un ouvrage en rond sans laisser de trou au centre.',
    titleEn: 'Magic Ring (MR)',
    descEn: 'Adjustable loop used to start crocheting in the round with no center hole.',
  },
  MR: {
    titleFr: 'Cercle magique (MR)',
    descFr: 'Abréviation anglaise pour Magic Ring (cercle magique ajustable).',
    titleEn: 'Magic Ring / Loop',
    descEn: 'Adjustable starting loop for closed round projects.',
  },
  'magic ring': {
    titleFr: 'Cercle magique (MR / CM)',
    descFr: 'Boucle ajustable pour démarrer un ouvrage en rond sans laisser de trou central.',
    titleEn: 'Magic Ring (MR)',
    descEn: 'Adjustable starting loop for closed round projects.',
  },

  // --- Chain / Maille en l'air ---
  ml: {
    titleFr: "Maille en l'air",
    descFr: 'Point de départ pour monter une chaînette ou créer la hauteur d’un nouveau rang.',
    titleEn: 'Chain Stitch',
    descEn: 'Foundation stitch used to begin a project or build row height.',
  },
  ch: {
    titleFr: "Maille en l'air (ch)",
    descFr: "Abréviation anglaise pour Chain (maille en l'air).",
    titleEn: 'Chain Stitch',
    descEn: 'Foundation loop used to build row height or create chains.',
  },

  // --- Slip Stitch / Maille Coulée ---
  mc: {
    titleFr: 'Maille coulée',
    descFr: 'Sert à fermer un tour ou à déplacer le fil de travail de façon invisible.',
    titleEn: 'Slip Stitch',
    descEn: 'Used to join rounds or move working yarn invisibly across stitches.',
  },
  'sl st': {
    titleFr: 'Maille coulée (sl st)',
    descFr: 'Abréviation anglaise pour Slip Stitch (maille coulée).',
    titleEn: 'Slip Stitch',
    descEn: 'Used to join rounds or move yarn smoothly across stitches.',
  },

  // --- Half Double Crochet / Demi-Bride ---
  db: {
    titleFr: 'Demi-bride',
    descFr: 'Point de hauteur intermédiaire apportant douceur et texture côtelée.',
    titleEn: 'Half Double Crochet (US)',
    descEn: 'Intermediate height stitch providing softness and texture.',
    extraEn: '🇬🇧 UK equivalent: Half Treble Crochet (htr)',
  },
  hdc: {
    titleFr: 'Demi-bride (hdc)',
    descFr: 'Abréviation anglaise pour Half Double Crochet (demi-bride).',
    titleEn: 'Half Double Crochet',
    descEn: 'Medium-height stitch providing flexibility and texture.',
    extraEn: '🇬🇧 UK equivalent: Half Treble Crochet (htr)',
  },

  // --- Double Crochet / Bride ---
  br: {
    titleFr: 'Bride',
    descFr: 'Point aéré et souple, très utilisé pour les vêtements, plaids et châles.',
    titleEn: 'Double Crochet (US)',
    descEn: 'Classic openwork stitch, popular for blankets, shawls, and garments.',
    extraEn: '🇬🇧 UK equivalent: Treble Crochet (tr)',
  },
  dc: {
    titleFr: 'Bride (dc US)',
    descFr: 'En termes US, Double Crochet désigne la bride (br). En UK, désigne la maille serrée.',
    titleEn: 'Double Crochet (US)',
    descEn: 'Standard tall, openwork stitch for blankets and garments.',
    extraEn: '🇬🇧 UK note: In British patterns, dc means Single Crochet.',
  },

  // --- Stitch / Maille ---
  m: {
    titleFr: 'Maille',
    descFr: 'Une maille individuelle du rang.',
    titleEn: 'Stitch',
    descEn: 'An individual stitch in the row.',
  },
  st: {
    titleFr: 'Maille (st)',
    descFr: 'Abréviation anglaise pour Stitch (maille).',
    titleEn: 'Stitch',
    descEn: 'An individual stitch in the round.',
  },
};

interface StitchTermProps {
  term: string;
  children?: React.ReactNode;
}

export function StitchTerm({ term, children }: StitchTermProps) {
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const info = STITCH_DEFINITIONS[term] || STITCH_DEFINITIONS[term.toLowerCase()] || STITCH_DEFINITIONS[term.toUpperCase()];

  if (!info) {
    return <span>{children || term}</span>;
  }

  const isFr = locale === 'fr';

  return (
    <span
      className="relative inline-block group cursor-help font-semibold text-sage-800 underline decoration-dotted decoration-sage-400 underline-offset-2 hover:decoration-sage-700 hover:text-sage-950 transition-colors"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
    >
      {children || term}

      {/* Tooltip Popup */}
      <span
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 max-w-[85vw] p-3.5 rounded-2xl bg-yarn-900 text-white text-xs shadow-lift border border-yarn-800 transition-all duration-200 ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto visible'
            : 'opacity-0 scale-95 translate-y-1 pointer-events-none invisible'
        }`}
        role="tooltip"
      >
        <div className="space-y-1.5 text-left font-sans">
          <div className="flex items-center justify-between border-b border-yarn-800 pb-1 mb-1">
            <span className="font-bold text-sage-300 font-serif text-sm">
              {term}
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-yarn-800 text-yarn-300">
              {t.common.stitchTermBadge}
            </span>
          </div>

          <p className="font-semibold text-white text-sm">
            {isFr ? info.titleFr : info.titleEn}
          </p>

          <p className="text-yarn-300 text-[11.5px] leading-relaxed">
            {isFr ? info.descFr : info.descEn}
          </p>

          {!isFr && info.extraEn && (
            <div className="pt-1.5 mt-1.5 border-t border-yarn-800 text-[10.5px] text-yarn-400 font-mono">
              {info.extraEn}
            </div>
          )}
        </div>

        {/* Tooltip Arrow */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-yarn-900" />
      </span>
    </span>
  );
}
