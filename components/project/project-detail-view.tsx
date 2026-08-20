'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Sparkles,
  FileText,
  Eye,
  EyeOff,
  Edit2,
  Check,
  X,
  Trash2,
  RotateCcw,
  Layers,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Loader2,
  Volleyball,
  ChevronDown,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { StitchTerm } from '@/components/ui/stitch-term';
import type { Tutorial, ChecklistItem, TutorialMaterial } from '@/lib/types/database';
import {
  toggleChecklistItem,
  updateChecklistItem,
  resetAllChecklistItems,
  resetSectionChecklistItems,
  checkAllChecklistItems,
  deleteTutorial,
} from '@/app/(dashboard)/library/[id]/actions';

interface ProjectDetailViewProps {
  tutorial: Tutorial;
  initialItems: ChecklistItem[];
  signedUrl: string | null;
}

// Known crochet terms for inline abbreviation highlighting
const STITCH_KEYS = [
  'cercle magique',
  'magic ring',
  'magic loop',
  'sl st',
  'ms',
  'sc',
  'aug',
  'inc',
  'dim',
  'dec',
  'CM',
  'MR',
  'ml',
  'ch',
  'mc',
  'db',
  'hdc',
  'br',
  'dc',
  'st',
  'm',
];

/**
 * Reactive interactive badge and tooltip for the total stitch count of a row (e.g. [18]).
 */
function StitchCountBadge({ count }: { count: string }) {
  const { locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const isFr = locale === 'fr';

  return (
    <span
      className="relative inline-block ml-2 select-none"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
    >
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-sage-100/90 hover:bg-sage-200/90 text-sage-900 border border-sage-200/80 shadow-2xs cursor-help transition-colors">
        {count}
      </span>

      {/* Reactive Tooltip Popup (Identical styling to StitchTerm) */}
      <span
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 max-w-[85vw] p-3 rounded-2xl bg-yarn-900 text-white text-xs shadow-lift border border-yarn-800 transition-all duration-200 ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto visible'
            : 'opacity-0 scale-95 translate-y-1 pointer-events-none invisible'
        }`}
        role="tooltip"
      >
        <div className="space-y-1 text-left font-sans">
          <div className="flex items-center justify-between border-b border-yarn-800 pb-1 mb-1">
            <span className="font-bold text-sage-300 font-serif text-xs">
              {isFr ? 'Total de mailles' : 'Stitch Count'}
            </span>
            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-yarn-800 text-sage-300">
              {count}
            </span>
          </div>
          <p className="text-yarn-300 text-[11px] leading-relaxed">
            {isFr
              ? 'Nombre total de mailles à obtenir à la fin de ce rang.'
              : 'Total number of stitches to have at the end of this round.'}
          </p>
        </div>

        {/* Tooltip Arrow */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-yarn-900" />
      </span>
    </span>
  );
}

/**
 * Parses text and wraps matching crochet terms in interactive <StitchTerm> tooltips,
 * and formats the ending stitch count (e.g. [18]) as a distinct visual badge.
 */
function renderWithStitchTerms(text: string) {
  if (!text) return null;

  // Detect stitch count at end of line like [18], [6 ms], or (18 sts)
  const stitchCountMatch = text.match(/(\s*(\[[0-9]+\s*[a-zA-Z]*\]|\([0-9]+\s*[a-zA-Z]*\))\s*)$/);

  let mainText = text;
  let countBadge: string | null = null;

  if (stitchCountMatch && typeof stitchCountMatch.index === 'number') {
    mainText = text.substring(0, stitchCountMatch.index);
    countBadge = stitchCountMatch[2]; // e.g. "[18]" or "(18)"
  }

  // Split by word boundaries while keeping delimiters
  const regex = new RegExp(`\\b(${STITCH_KEYS.join('|')})\\b`, 'gi');
  const parts = mainText.split(regex);

  const renderedContent = parts.map((part, index) => {
    const lower = part.toLowerCase();
    const matched = STITCH_KEYS.find((k) => k.toLowerCase() === lower);

    if (matched) {
      return (
        <StitchTerm key={`${index}-${part}`} term={matched}>
          {part}
        </StitchTerm>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });

  return (
    <span>
      {renderedContent}
      {countBadge && <StitchCountBadge count={countBadge} />}
    </span>
  );
}

/**
 * Detects whether a section name represents a numbered or ordinal piece
 * (e.g. "Jambe 1", "Première jambe", "Premier bras", "Leg 1", "Oreille 2", "1ère botte").
 */
function parseSectionOrdinal(secName: string): { base: string; index: number; formattedSubTitle: string; rawKey: string } | null {
  const trimmed = secName.trim();

  // Pattern A: Suffix number "Jambe 1", "Oreille 2", "Leg 1", "Arm 2", "Botte #1", "Botte n°2"
  const suffixMatch = trimmed.match(/^(.*?)\s*(?:n°|#)?\s*([0-9]+)$/i);
  if (suffixMatch) {
    const rawBase = suffixMatch[1].trim();
    const index = parseInt(suffixMatch[2], 10);
    const base = rawBase.charAt(0).toUpperCase() + rawBase.slice(1);
    return {
      base,
      index,
      formattedSubTitle: `${base} ${index}`,
      rawKey: secName,
    };
  }

  // Pattern B: Ordinal prefix (FR/EN) - Première / 1ère / Premier / 1er / First / 1st
  const firstMatch = trimmed.match(/^(premi[eè]re?|1[eè]re?|1er|1st|first)\s+(.*)$/i);
  if (firstMatch) {
    const rawBase = firstMatch[2].trim();
    const base = rawBase.charAt(0).toUpperCase() + rawBase.slice(1);
    return {
      base,
      index: 1,
      formattedSubTitle: `${base} 1`,
      rawKey: secName,
    };
  }

  // Pattern C: Deuxième / 2ème / 2e / Seconde / Second / 2nd
  const secondMatch = trimmed.match(/^(deuxi[eè]me|2[eè]me|2eme|2e|seconde?|2nd|second)\s+(.*)$/i);
  if (secondMatch) {
    const rawBase = secondMatch[2].trim();
    const base = rawBase.charAt(0).toUpperCase() + rawBase.slice(1);
    return {
      base,
      index: 2,
      formattedSubTitle: `${base} 2`,
      rawKey: secName,
    };
  }

  // Pattern D: Troisième / 3ème / 3e / 3rd / Third
  const thirdMatch = trimmed.match(/^(troisi[eè]me|3[eè]me|3eme|3e|3rd|third)\s+(.*)$/i);
  if (thirdMatch) {
    const rawBase = thirdMatch[2].trim();
    const base = rawBase.charAt(0).toUpperCase() + rawBase.slice(1);
    return {
      base,
      index: 3,
      formattedSubTitle: `${base} 3`,
      rawKey: secName,
    };
  }

  // Pattern E: Quatrième / 4ème / 4e / 4th / Fourth
  const fourthMatch = trimmed.match(/^(quatri[eè]me|4[eè]me|4eme|4e|4th|fourth)\s+(.*)$/i);
  if (fourthMatch) {
    const rawBase = fourthMatch[2].trim();
    const base = rawBase.charAt(0).toUpperCase() + rawBase.slice(1);
    return {
      base,
      index: 4,
      formattedSubTitle: `${base} 4`,
      rawKey: secName,
    };
  }

  return null;
}

export function ProjectDetailView({
  tutorial,
  initialItems,
  signedUrl,
}: ProjectDetailViewProps) {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Item currently being edited inline
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');

  // Delete modal state
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Badge tactile pop animation key (increments on every row check)
  const [bumpKey, setBumpKey] = useState(0);

  // Supplies checklist state
  const [checkedMaterials, setCheckedMaterials] = useState<Set<number>>(new Set());

  const toggleMaterial = (index: number) => {
    setCheckedMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // User manual overrides for accordion expansion:
  // true = explicitly forced open by user, false = explicitly forced closed by user
  const [sectionOverrides, setSectionOverrides] = useState<Record<string, boolean>>({});

  const toggleSection = (groupTitle: string, isCurrentlyDone: boolean) => {
    setSectionOverrides((prev) => {
      const currentEffectiveOpen = prev[groupTitle] !== undefined ? prev[groupTitle] : !isCurrentlyDone;
      return {
        ...prev,
        [groupTitle]: !currentEffectiveOpen,
      };
    });
  };

  // Calculate progress metrics
  const totalItems = items.length;
  const completedCount = items.filter((item) => item.checked).length;
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
  const isAllDone = totalItems > 0 && completedCount === totalItems;

  // Trigger single step mini burst
  const triggerStepConfetti = (e?: React.MouseEvent) => {
    try {
      let origin = { x: 0.5, y: 0.6 };
      if (e) {
        origin = {
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight,
        };
      }
      confetti({
        particleCount: 25,
        spread: 45,
        origin,
        colors: ['#3e5c46', '#87a08b', '#d89b72', '#ecd3b4'],
        zIndex: 99999,
        disableForReducedMotion: true,
      });
    } catch {
      // Ignore if canvas-confetti fails
    }
  };

  // Trigger grand celebration confetti (100% completed)
  const triggerGrandConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#3e5c46', '#87a08b', '#d89b72', '#ecd3b4', '#10b981'],
        zIndex: 99999,
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#3e5c46', '#d89b72', '#10b981'],
          zIndex: 99999,
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#87a08b', '#ecd3b4', '#10b981'],
          zIndex: 99999,
        });
      }, 250);
    } catch {
      // Ignore if confetti fails
    }
  };

  // Handle single check toggle
  const handleToggle = (itemId: string, e?: React.MouseEvent) => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;

    const newChecked = !targetItem.checked;

    // Optimistic UI update
    const updated = items.map((i) => (i.id === itemId ? { ...i, checked: newChecked } : i));
    setItems(updated);

    // Trigger subtle tactile pop animation on percentage badge
    setBumpKey((k) => k + 1);

    if (newChecked) {
      triggerStepConfetti(e);
    } else {
      // If unchecking, clear forced-closed overrides so the section stays open
      setSectionOverrides((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (next[k] === false) delete next[k];
        });
        return next;
      });
    }

    const nowCompleted = updated.filter((i) => i.checked).length;
    if (nowCompleted === totalItems && totalItems > 0) {
      triggerGrandConfetti();
    }

    startTransition(async () => {
      try {
        await toggleChecklistItem(itemId, newChecked);
      } catch (err) {
        console.error('Failed to toggle item:', err);
        setItems(items);
      }
    });
  };

  // Handle row label save
  const handleSaveLabel = (itemId: string) => {
    if (!editLabel.trim()) return;

    const updated = items.map((i) =>
      i.id === itemId ? { ...i, label: editLabel.trim(), edited_by_user: true } : i
    );
    setItems(updated);
    setEditingItemId(null);

    const currentItem = items.find((i) => i.id === itemId);
    startTransition(async () => {
      try {
        await updateChecklistItem(itemId, editLabel, currentItem?.note);
      } catch (err) {
        console.error('Failed to update item label:', err);
      }
    });
  };

  // Handle row note save
  const handleSaveNote = (itemId: string) => {
    const updated = items.map((i) =>
      i.id === itemId ? { ...i, note: editNote.trim() || null } : i
    );
    setItems(updated);
    setEditingNoteId(null);

    const currentItem = items.find((i) => i.id === itemId);
    startTransition(async () => {
      try {
        await updateChecklistItem(itemId, currentItem?.label || '', editNote);
      } catch (err) {
        console.error('Failed to update note:', err);
      }
    });
  };

  // Handle delete item
  const handleDeleteItem = (itemId: string) => {
    const updated = items.filter((i) => i.id !== itemId);
    setItems(updated);
  };

  // Handle reset all
  const handleResetAll = () => {
    setItems((prev) => prev.map((i) => ({ ...i, checked: false })));
    setSectionOverrides({});
    setBumpKey((k) => k + 1);

    startTransition(async () => {
      try {
        await resetAllChecklistItems(tutorial.id);
      } catch (err) {
        console.error('Failed to reset all:', err);
      }
    });
  };

  // Handle reset single section
  const handleResetSection = (sectionName: string) => {
    const updated = items.map((i) =>
      i.section === sectionName ? { ...i, checked: false } : i
    );
    setItems(updated);
    startTransition(async () => {
      try {
        await resetSectionChecklistItems(tutorial.id, sectionName);
      } catch (err) {
        console.error('Failed to reset section:', err);
      }
    });
  };

  // Handle reset multiple sub-sections (e.g. all of Jambes)
  const handleResetMultipleSections = (sectionNames: string[]) => {
    const nameSet = new Set(sectionNames);
    const updated = items.map((i) =>
      nameSet.has(i.section) ? { ...i, checked: false } : i
    );
    setItems(updated);
    startTransition(async () => {
      try {
        for (const secName of sectionNames) {
          await resetSectionChecklistItems(tutorial.id, secName);
        }
      } catch (err) {
        console.error('Failed to reset group sections:', err);
      }
    });
  };

  // Handle delete project
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteTutorial(tutorial.id);
    } catch (err) {
      console.error('Failed to delete tutorial:', err);
      setIsDeleting(false);
    }
  };

  // Group checklist items by section and automatically group pairs/multiples
  const rawSectionsMap = items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    const sec = item.section || t.project.sectionGeneral;
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(item);
    return acc;
  }, {});

  const sectionGroups: {
    groupTitle: string;
    isMultiple: boolean;
    totalCount: number;
    completedCount: number;
    subSections: {
      subTitle: string;
      rawSectionName: string;
      items: ChecklistItem[];
    }[];
  }[] = [];

  const processedSections = new Set<string>();
  const sectionKeys = Object.keys(rawSectionsMap);

  sectionKeys.forEach((secName) => {
    if (processedSections.has(secName)) return;

    const parsed = parseSectionOrdinal(secName);

    if (parsed) {
      // Find all sibling sections with the same normalized base name
      const siblingEntries = sectionKeys
        .map((k) => parseSectionOrdinal(k))
        .filter((p): p is NonNullable<typeof p> => p !== null && p.base.toLowerCase() === parsed.base.toLowerCase());

      if (siblingEntries.length > 1) {
        // Sort numerically (1, 2, 3, 4)
        siblingEntries.sort((a, b) => a.index - b.index);

        // Pluralize group title cleanly
        let displayGroupTitle = parsed.base;
        if (!displayGroupTitle.endsWith('s') && !displayGroupTitle.endsWith('x')) {
          displayGroupTitle = `${displayGroupTitle}s`;
        }

        const subSections = siblingEntries.map((sibling) => ({
          subTitle: sibling.formattedSubTitle,
          rawSectionName: sibling.rawKey,
          items: rawSectionsMap[sibling.rawKey] || [],
        }));

        const allItems = subSections.flatMap((s) => s.items);
        const totalCount = allItems.length;
        const completedCount = allItems.filter((i) => i.checked).length;

        sectionGroups.push({
          groupTitle: displayGroupTitle,
          isMultiple: true,
          totalCount,
          completedCount,
          subSections,
        });

        siblingEntries.forEach((s) => processedSections.add(s.rawKey));
        return;
      }
    }

    // Standalone section (Tête, Corps, Assemblage, etc.)
    const secItems = rawSectionsMap[secName] || [];
    const totalCount = secItems.length;
    const completedCount = secItems.filter((i) => i.checked).length;

    sectionGroups.push({
      groupTitle: secName,
      isMultiple: false,
      totalCount,
      completedCount,
      subSections: [
        {
          subTitle: secName,
          rawSectionName: secName,
          items: secItems,
        },
      ],
    });
    processedSections.add(secName);
  });

  const materialsList = (Array.isArray(tutorial.materials)
    ? tutorial.materials
    : []) as TutorialMaterial[];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 transition-all duration-300">
      {/* Unified Sticky Reader Bar (Project Title + Navigation + Progress + Tools in White Glass Card) */}
      <div className="sticky top-2 sm:top-3 z-30 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-2xl border border-yarn-200/90 shadow-lift ring-1 ring-black/[0.04] space-y-3 sm:space-y-3.5 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3.5">
          {/* Left: Quick Back + Progress Percent Badge + Project Title + Counters */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <Link
              href="/library"
              title={t.project.backToLibrary}
              className="p-2 sm:p-2.5 rounded-2xl bg-yarn-100/80 hover:bg-yarn-200 text-yarn-800 hover:text-yarn-950 transition-all shrink-0 flex items-center justify-center border border-yarn-200/90 shadow-2xs hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            {/* Prominent Circular/Squircle Progress Badge with Tactile Pop */}
            <div
              key={`badge-progress-${bumpKey}`}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-bold shadow-soft transition-colors duration-200 ${
                bumpKey > 0 ? 'animate-badge-pop' : ''
              } ${
                isAllDone
                  ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white ring-2 ring-emerald-400/50 shadow-emerald-700/20'
                  : progressPercent > 0
                  ? 'bg-gradient-to-br from-sage-800 to-sage-900 text-white ring-2 ring-sage-600/40 shadow-sm'
                  : 'bg-gradient-to-br from-yarn-400 to-yarn-500 text-white ring-1 ring-yarn-300'
              }`}
            >
              {isAllDone ? (
                <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
              ) : (
                <span className="text-xs sm:text-sm font-extrabold tracking-tight leading-none text-white">
                  {progressPercent}%
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                <h1 className="text-sm sm:text-xl font-bold font-serif text-yarn-950 tracking-tight truncate max-w-[160px] sm:max-w-none">
                  {tutorial.title}
                </h1>
                {tutorial.project_type && (
                  <span className="hidden md:inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-yarn-100 text-yarn-800 border border-yarn-200 shrink-0">
                    {tutorial.project_type}
                  </span>
                )}
                {tutorial.level && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sage-100 text-sage-900 border border-sage-200 shrink-0">
                    {(t.project.levels as any)?.[tutorial.level.toLowerCase()] || tutorial.level}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-yarn-600">
                <span className="truncate">
                  {completedCount} / {totalItems} {t.project.roundsCompleted}
                </span>
                {isAllDone && (
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 shrink-0">
                    {t.project.allDone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {/* Toggle PDF / Original Image button */}
            {signedUrl && (
              <button
                type="button"
                onClick={() => setShowOriginal(!showOriginal)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold border transition-all shadow-2xs hover:scale-105 active:scale-95 ${
                  showOriginal
                    ? 'bg-sage-800 text-white border-sage-900 shadow-soft'
                    : 'bg-white text-yarn-800 hover:bg-yarn-100 border-yarn-300'
                }`}
              >
                {showOriginal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">
                  {showOriginal ? t.project.hideOriginal : t.project.viewOriginal}
                </span>
                <span className="md:hidden text-[11px]">PDF</span>
              </button>
            )}

            {/* Reset All Checkboxes Button */}
            <button
              type="button"
              onClick={handleResetAll}
              title={t.project.uncheckAll}
              className="p-2 sm:p-2.5 rounded-xl bg-white hover:bg-yarn-100 border border-yarn-300 text-yarn-700 hover:text-yarn-950 transition-all shadow-2xs hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Prominent Glow Progress Track */}
        <div className="w-full h-2 sm:h-3 rounded-full bg-yarn-100 overflow-hidden border border-yarn-200/90 shadow-inner p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isAllDone
                ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 shadow-sm'
                : 'bg-gradient-to-r from-sage-800 via-sage-700 to-sage-500 shadow-sm'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Project Content (Split view on Desktop: 50/50 Desktop, Checklist full width on Mobile) */}
      <div className={`grid gap-8 ${showOriginal ? 'lg:grid-cols-2 items-start' : 'grid-cols-1'}`}>
        {/* Checklist & Pattern Details Column */}
        <div className="space-y-8 w-full">
          {/* Materials Checklist Card */}
          {(materialsList.length > 0 || tutorial.stitch) && (
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-yarn-200 shadow-soft space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-yarn-100 pb-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sage-100 text-sage-800 flex items-center justify-center font-bold shrink-0">
                    <Volleyball className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-serif text-yarn-950">
                      {t.project.materialsTitle}
                    </h2>
                    {materialsList.length > 0 && (
                      <p className="text-[11px] font-medium text-yarn-500">
                        {checkedMaterials.size} / {materialsList.length} prêtes
                      </p>
                    )}
                  </div>
                </div>

                {tutorial.stitch && (
                  <div className="flex items-center gap-1.5 text-xs text-yarn-700 bg-yarn-50 px-3 py-1.5 rounded-xl border border-yarn-200 shadow-2xs shrink-0">
                    <span className="font-semibold text-yarn-900">{t.project.materialsHook} :</span>
                    <span className="font-mono font-bold text-sage-800">{tutorial.stitch}</span>
                  </div>
                )}
              </div>

              {materialsList.length > 0 && (
                <div className="space-y-2">
                  {materialsList.map((m, idx) => {
                    const isChecked = checkedMaterials.has(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleMaterial(idx)}
                        className={`group flex items-start justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${isChecked
                          ? 'bg-yarn-50/50 border-yarn-200 opacity-70'
                          : 'bg-white border-yarn-200/90 hover:border-yarn-300 hover:shadow-2xs'
                          }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMaterial(idx);
                            }}
                            className="mt-0.5 flex-shrink-0 text-yarn-700 hover:text-yarn-900 transition-colors"
                          >
                            {isChecked ? (
                              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 fill-emerald-100" />
                            ) : (
                              <Circle className="w-4.5 h-4.5 text-yarn-400 group-hover:text-yarn-600" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <span
                              className={`text-xs sm:text-sm font-semibold leading-snug transition-colors ${isChecked ? 'line-through text-yarn-500' : 'text-yarn-900'
                                }`}
                            >
                              {m.name || (m as any).item}
                            </span>
                            {m.details && (
                              <span className="block text-xs text-yarn-500 italic mt-0.5">
                                {m.details}
                              </span>
                            )}
                          </div>
                        </div>

                        {m.quantity && (
                          <span
                            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold shrink-0 transition-colors ${isChecked
                              ? 'bg-yarn-100 text-yarn-600 border border-yarn-200'
                              : 'bg-sage-100/90 text-sage-900 border border-sage-200'
                              }`}
                          >
                            {m.quantity}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sectioned Checklist */}
          <div className="space-y-6">
            {sectionGroups.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-yarn-200 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-yarn-400 mx-auto" />
                <p className="text-sm font-semibold text-yarn-800">{t.project.emptySteps}</p>
              </div>
            ) : (
              sectionGroups.map((group) => {
                if (group.isMultiple) {
                  const isGroupDone = group.completedCount === group.totalCount && group.totalCount > 0;
                  const isCollapsed = sectionOverrides[group.groupTitle] !== undefined
                    ? !sectionOverrides[group.groupTitle]
                    : isGroupDone;
                  return (
                    <div
                      key={group.groupTitle}
                      className={`rounded-3xl bg-white border border-yarn-200 shadow-soft transition-all ${
                        isCollapsed ? 'p-3.5 sm:p-5' : 'p-4 sm:p-6 lg:p-7 space-y-5 sm:space-y-6'
                      }`}
                    >
                      {/* Master Multi-Part Header (e.g. Jambes, Bras, Oreilles) */}
                      <div
                        onClick={() => toggleSection(group.groupTitle, isGroupDone)}
                        className={`flex items-center justify-between gap-2 min-w-0 cursor-pointer select-none transition-colors ${
                          isCollapsed ? '' : 'border-b border-yarn-200/80 pb-3 sm:pb-4'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sage-100 text-sage-800 flex items-center justify-center font-bold shrink-0">
                            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                            <h2 className="text-sm sm:text-base lg:text-lg font-bold font-serif text-yarn-950 truncate">
                              {group.groupTitle}
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yarn-100 text-yarn-800 border border-yarn-200 shrink-0">
                              x{group.subSections.length}
                            </span>
                            {isGroupDone && isCollapsed && (
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 animate-in fade-in shrink-0">
                                Terminé ✓
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {group.completedCount > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResetMultipleSections(group.subSections.map((s) => s.rawSectionName || s.subTitle));
                              }}
                              title={t.project.resetSection}
                              className="p-1.5 rounded-xl text-yarn-400 hover:text-yarn-800 hover:bg-yarn-100 transition-colors flex items-center gap-1 text-xs"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline text-[11px]">{t.project.resetSection}</span>
                            </button>
                          )}
                          <span
                            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl border ${
                              isGroupDone
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'text-yarn-700 bg-yarn-50 border-yarn-200'
                            }`}
                          >
                            {group.completedCount} / {group.totalCount}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-yarn-500 transition-transform duration-200 ${
                              isCollapsed ? '-rotate-90' : 'rotate-0'
                            }`}
                          />
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          {/* Multi-part micro-progress track */}
                          <div className="w-full h-1.5 bg-yarn-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${
                                isGroupDone ? 'bg-emerald-500' : 'bg-sage-600'
                              }`}
                              style={{
                                width: `${group.totalCount > 0 ? (group.completedCount / group.totalCount) * 100 : 0}%`,
                              }}
                            />
                          </div>

                          {/* Sub-Sections Grid */}
                          <div className={`grid grid-cols-1 ${showOriginal ? 'grid-cols-1' : 'md:grid-cols-2'} gap-5 min-w-0`}>
                            {group.subSections.map((sub) => {
                              const subCompleted = sub.items.filter((i) => i.checked).length;
                              const isSubDone = subCompleted === sub.items.length && sub.items.length > 0;
                              return (
                                <div
                                  key={sub.subTitle}
                                  className="p-4 sm:p-5 rounded-2xl bg-yarn-50/60 border border-yarn-200/80 space-y-3.5 min-w-0"
                                >
                                  {/* Sub-Header (e.g. Jambe 1, Jambe 2) */}
                                  <div className="space-y-2 border-b border-yarn-200/60 pb-2.5">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`w-2 h-2 rounded-full ${
                                            isSubDone ? 'bg-emerald-500' : 'bg-sage-600'
                                          }`}
                                        />
                                        <h3 className="text-sm font-bold font-serif text-yarn-900">
                                          {sub.subTitle}
                                        </h3>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        {subCompleted > 0 && (
                                          <button
                                            type="button"
                                            onClick={() => handleResetSection(sub.rawSectionName || sub.subTitle)}
                                            title={t.project.resetSection}
                                            className="p-1 rounded-md text-yarn-400 hover:text-yarn-800 hover:bg-white transition-colors"
                                          >
                                            <RotateCcw className="w-3 h-3" />
                                          </button>
                                        )}
                                        <span
                                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                                            isSubDone
                                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                              : 'text-yarn-600 bg-white border-yarn-200'
                                          }`}
                                        >
                                          {subCompleted} / {sub.items.length}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Sub-section micro-progress track */}
                                    <div className="w-full h-1 bg-yarn-200/80 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full transition-all duration-300 rounded-full ${
                                          isSubDone ? 'bg-emerald-500' : 'bg-sage-600'
                                        }`}
                                        style={{
                                          width: `${sub.items.length > 0 ? (subCompleted / sub.items.length) * 100 : 0}%`,
                                        }}
                                      />
                                    </div>
                                  </div>

                                  {/* Sub-Section Items */}
                                  <div className="space-y-2.5">
                                    {sub.items.map((item) => (
                                      <div
                                        key={item.id}
                                        onClick={(e) => {
                                          if (editingItemId !== item.id && editingNoteId !== item.id) {
                                            handleToggle(item.id, e);
                                          }
                                        }}
                                        className={`group p-3 rounded-xl border transition-all cursor-pointer select-none ${
                                          item.checked
                                            ? 'bg-yarn-100/50 border-yarn-200 opacity-75'
                                            : 'bg-white border-yarn-200 hover:border-yarn-300 hover:shadow-soft'
                                        }`}
                                      >
                                        <div className="flex items-start gap-2.5">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggle(item.id, e);
                                            }}
                                            className="mt-0.5 flex-shrink-0 text-yarn-700 hover:text-yarn-900 transition-colors"
                                          >
                                            {item.checked ? (
                                              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 fill-emerald-100" />
                                            ) : (
                                              <Circle className="w-4.5 h-4.5 text-yarn-400 group-hover:text-yarn-600" />
                                            )}
                                          </button>

                                          <div className="flex-1 min-w-0">
                                            {editingItemId === item.id ? (
                                              <div
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex items-center gap-2"
                                              >
                                                <input
                                                  type="text"
                                                  value={editLabel}
                                                  onChange={(e) => setEditLabel(e.target.value)}
                                                  className="w-full px-2.5 py-1 rounded-lg border border-yarn-300 text-xs focus:ring-2 focus:ring-sage-500 focus:outline-none"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => handleSaveLabel(item.id)}
                                                  className="p-1 rounded-md bg-sage-800 text-white hover:bg-sage-900"
                                                >
                                                  <Check className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setEditingItemId(null)}
                                                  className="p-1 rounded-md bg-yarn-200 text-yarn-800 hover:bg-yarn-300"
                                                >
                                                  <X className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            ) : (
                                              <div className="flex items-start justify-between gap-1.5">
                                                <div
                                                  className={`text-xs sm:text-sm font-medium leading-relaxed ${
                                                    item.checked ? 'line-through text-yarn-500' : 'text-yarn-900'
                                                  }`}
                                                >
                                                  {renderWithStitchTerms(item.label)}
                                                </div>

                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingItemId(item.id);
                                                    setEditLabel(item.label);
                                                  }}
                                                  title={t.project.editStep}
                                                  className="opacity-0 group-hover:opacity-100 p-1 text-yarn-400 hover:text-yarn-700 transition-opacity"
                                                >
                                                  <Edit2 className="w-3 h-3" />
                                                </button>
                                              </div>
                                            )}

                                            {editingNoteId === item.id ? (
                                              <div
                                                onClick={(e) => e.stopPropagation()}
                                                className="mt-1.5 flex items-center gap-1.5"
                                              >
                                                <input
                                                  type="text"
                                                  value={editNote}
                                                  placeholder={t.project.notePlaceholder}
                                                  onChange={(e) => setEditNote(e.target.value)}
                                                  className="w-full px-2.5 py-1 rounded-lg border border-yarn-300 text-xs focus:ring-2 focus:ring-sage-500 focus:outline-none"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => handleSaveNote(item.id)}
                                                  className="p-1 rounded-md bg-sage-800 text-white text-xs px-2"
                                                >
                                                  {t.project.saveStep}
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setEditingNoteId(null)}
                                                  className="p-1 rounded-md bg-yarn-200 text-yarn-800 text-xs px-2"
                                                >
                                                  {t.project.cancelEdit}
                                                </button>
                                              </div>
                                            ) : item.note ? (
                                              <div
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingNoteId(item.id);
                                                  setEditNote(item.note || '');
                                                }}
                                                className="mt-1 text-[11px] text-sage-800 bg-sage-50 border border-sage-200 rounded-md px-2 py-0.5 inline-flex items-center gap-1 cursor-pointer hover:bg-sage-100 transition-colors"
                                              >
                                                <MessageSquare className="w-2.5 h-2.5 text-sage-600" />
                                                <span>{item.note}</span>
                                              </div>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingNoteId(item.id);
                                                  setEditNote('');
                                                }}
                                                className="mt-0.5 text-[10px] text-yarn-400 hover:text-yarn-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                {t.project.addNote}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // Standalone section (Tête, Corps, Assemblage, etc.)
                const sub = group.subSections[0];
                const isDone = group.completedCount === group.totalCount && group.totalCount > 0;
                const isCollapsed = sectionOverrides[group.groupTitle] !== undefined
                  ? !sectionOverrides[group.groupTitle]
                  : isDone;
                return (
                  <div
                    key={group.groupTitle}
                    className={`rounded-3xl bg-white border border-yarn-200 shadow-soft transition-all ${
                      isCollapsed ? 'p-3.5 sm:p-5' : 'p-4 sm:p-6 lg:p-7 space-y-4 sm:space-y-5'
                    }`}
                  >
                    {/* Section Header */}
                    <div
                      onClick={() => toggleSection(group.groupTitle, isDone)}
                      className={`cursor-pointer select-none transition-colors ${
                        isCollapsed ? '' : 'space-y-2.5 sm:space-y-3 border-b border-yarn-100 pb-2.5 sm:pb-3'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Layers className="w-4 h-4 text-sage-700 shrink-0" />
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                            <h2 className="text-sm sm:text-base font-bold font-serif text-yarn-900 truncate">
                              {group.groupTitle}
                            </h2>
                            {isDone && isCollapsed && (
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 animate-in fade-in shrink-0">
                                Terminé ✓
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {group.completedCount > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResetSection(sub.rawSectionName || group.groupTitle);
                              }}
                              title={t.project.resetSection}
                              className="p-1 rounded-lg text-yarn-400 hover:text-yarn-800 hover:bg-yarn-100 transition-colors flex items-center gap-1 text-xs"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline text-[11px]">{t.project.resetSection}</span>
                            </button>
                          )}
                          <span
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'text-yarn-600 bg-yarn-50 border-yarn-200'
                            }`}
                          >
                            {group.completedCount} / {group.totalCount}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-yarn-500 transition-transform duration-200 ${
                              isCollapsed ? '-rotate-90' : 'rotate-0'
                            }`}
                          />
                        </div>
                      </div>

                      {!isCollapsed && (
                        /* Standalone section micro-progress track */
                        <div className="w-full h-1.5 bg-yarn-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              isDone ? 'bg-emerald-500' : 'bg-sage-600'
                            }`}
                            style={{
                              width: `${group.totalCount > 0 ? (group.completedCount / group.totalCount) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {!isCollapsed && (
                      /* Section Items (Single vertical column for natural top-to-bottom reading order) */
                      <div className="space-y-2.5 animate-in fade-in duration-200">
                        {sub.items.map((item) => (
                          <div
                            key={item.id}
                            onClick={(e) => {
                              if (editingItemId !== item.id && editingNoteId !== item.id) {
                                handleToggle(item.id, e);
                              }
                            }}
                            className={`group p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                              item.checked
                                ? 'bg-yarn-50/50 border-yarn-200 opacity-75'
                                : 'bg-white border-yarn-200 hover:border-yarn-300 hover:shadow-soft'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggle(item.id, e);
                                }}
                                className="mt-0.5 flex-shrink-0 text-yarn-700 hover:text-yarn-900 transition-colors"
                              >
                                {item.checked ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                                ) : (
                                  <Circle className="w-5 h-5 text-yarn-400 group-hover:text-yarn-600" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                {editingItemId === item.id ? (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-2"
                                  >
                                    <input
                                      type="text"
                                      value={editLabel}
                                      onChange={(e) => setEditLabel(e.target.value)}
                                      className="w-full px-3 py-1.5 rounded-xl border border-yarn-300 text-sm focus:ring-2 focus:ring-sage-500 focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveLabel(item.id)}
                                      className="p-1.5 rounded-lg bg-sage-800 text-white hover:bg-sage-900"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingItemId(null)}
                                      className="p-1.5 rounded-lg bg-yarn-200 text-yarn-800 hover:bg-yarn-300"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-start justify-between gap-2">
                                    <div
                                      className={`text-sm font-medium leading-relaxed ${
                                        item.checked ? 'line-through text-yarn-500' : 'text-yarn-900'
                                      }`}
                                    >
                                      {renderWithStitchTerms(item.label)}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingItemId(item.id);
                                        setEditLabel(item.label);
                                      }}
                                      title={t.project.editStep}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-yarn-400 hover:text-yarn-700 transition-opacity"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}

                                {editingNoteId === item.id ? (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-2 flex items-center gap-2"
                                  >
                                    <input
                                      type="text"
                                      value={editNote}
                                      placeholder={t.project.notePlaceholder}
                                      onChange={(e) => setEditNote(e.target.value)}
                                      className="w-full px-3 py-1 rounded-xl border border-yarn-300 text-xs focus:ring-2 focus:ring-sage-500 focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveNote(item.id)}
                                      className="p-1 rounded-lg bg-sage-800 text-white text-xs px-2"
                                    >
                                      {t.project.saveStep}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingNoteId(null)}
                                      className="p-1 rounded-md bg-yarn-200 text-yarn-800 text-xs px-2"
                                    >
                                      {t.project.cancelEdit}
                                    </button>
                                  </div>
                                ) : item.note ? (
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingNoteId(item.id);
                                      setEditNote(item.note || '');
                                    }}
                                    className="mt-1 text-[11px] text-sage-800 bg-sage-50 border border-sage-200 rounded-md px-2 py-0.5 inline-flex items-center gap-1 cursor-pointer hover:bg-sage-100 transition-colors"
                                  >
                                    <MessageSquare className="w-2.5 h-2.5 text-sage-600" />
                                    <span>{item.note}</span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingNoteId(item.id);
                                      setEditNote('');
                                    }}
                                    className="mt-0.5 text-[10px] text-yarn-400 hover:text-yarn-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    {t.project.addNote}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Desktop Side-by-Side PDF / Image Viewer (50% on Desktop, hidden on Mobile) */}
        {signedUrl && (
          <div
            className={`hidden ${
              showOriginal ? 'lg:flex' : 'lg:hidden'
            } w-full lg:h-[calc(100vh-160px)] lg:sticky lg:top-[140px] z-20 rounded-3xl bg-white border border-yarn-300 shadow-lift overflow-hidden flex-col animate-in fade-in duration-200`}
          >
            <div className="p-4 border-b border-yarn-200 bg-yarn-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-yarn-800">
                <FileText className="w-4 h-4 text-sage-700" />
                <span>
                  {tutorial.source_type === 'pdf'
                    ? t.project.originalPdf
                    : t.project.originalImages}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-sage-700 hover:text-sage-900 font-semibold"
                >
                  <span>{t.project.openInNewTab}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setShowOriginal(false)}
                  className="p-1 rounded-lg text-yarn-400 hover:text-yarn-800 hover:bg-yarn-200 transition-colors ml-1"
                  title={t.project.hideOriginal}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full bg-yarn-100 relative">
              {tutorial.source_type === 'pdf' ? (
                <iframe
                  src={`${signedUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-none"
                  title="PDF Viewer Desktop"
                />
              ) : (
                <div className="w-full h-full overflow-auto p-4 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signedUrl}
                    alt={tutorial.title}
                    className="max-w-full max-h-full object-contain rounded-xl shadow-soft"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Slide-Up Bottom Sheet Drawer (Retains PDF page & scroll position permanently) */}
      {signedUrl && (
        <div
          className={`lg:hidden fixed inset-0 z-50 flex flex-col justify-end transition-all duration-300 ${
            showOriginal ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'
          }`}
        >
          {/* Backdrop with blur */}
          <div
            className={`fixed inset-0 bg-yarn-950/60 backdrop-blur-sm transition-opacity duration-300 ${
              showOriginal ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setShowOriginal(false)}
          />

          {/* Sheet Modal Container */}
          <div
            className={`relative w-full h-[88vh] max-h-[88vh] bg-white rounded-t-3xl border-t border-yarn-300 shadow-2xl flex flex-col overflow-hidden z-10 transition-transform duration-300 ease-out ${
              showOriginal ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            {/* Grab Handle */}
            <div className="pt-2.5 pb-1 flex justify-center bg-yarn-50">
              <div className="w-10 h-1 rounded-full bg-yarn-300" />
            </div>

            {/* Sheet Header */}
            <div className="px-4 py-3 border-b border-yarn-200 bg-yarn-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-yarn-800">
                <FileText className="w-4 h-4 text-sage-700" />
                <span>
                  {tutorial.source_type === 'pdf'
                    ? t.project.originalPdf
                    : t.project.originalImages}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-sage-700 hover:text-sage-900 font-semibold px-2.5 py-1 rounded-xl bg-sage-50 border border-sage-200 shadow-2xs"
                >
                  <span>{t.project.openInNewTab}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setShowOriginal(false)}
                  className="p-1.5 rounded-full bg-yarn-200 text-yarn-800 hover:bg-yarn-300 transition-colors"
                  title={t.project.hideOriginal}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sheet Content Body */}
            <div className="flex-1 w-full bg-yarn-100 relative overflow-hidden">
              {tutorial.source_type === 'pdf' ? (
                <iframe
                  src={`${signedUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-none"
                  title="PDF Viewer Mobile"
                />
              ) : (
                <div className="w-full h-full overflow-auto p-4 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signedUrl}
                    alt={tutorial.title}
                    className="max-w-full max-h-full object-contain rounded-xl shadow-soft"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Footer Project Actions (Discreet delete zone) */}
      <div className="pt-8 border-t border-yarn-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-yarn-500">
        <div>
          <span>{t.project.savedOn} {new Date(tutorial.saved_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}</span>
        </div>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors font-medium cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{t.project.deleteProject}</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lift space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-2">
              <h3 className="text-xl font-bold font-serif text-yarn-950">
                {t.project.deleteProject}
              </h3>
              <p className="text-sm text-yarn-600 leading-relaxed">
                {t.project.deleteConfirm}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl border border-yarn-300 text-sm font-semibold text-yarn-700 hover:bg-yarn-100 transition-colors"
              >
                {t.project.cancelEdit}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isDeleting ? t.project.deleting : t.project.deleteProject}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
