'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
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
  CheckCheck,
  Copy,
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
  ChevronLeft,
  ChevronRight,
  Globe,
  Languages,
  ZoomIn,
  ZoomOut,
  Tag,
  BookOpen,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { CategoryBadge, CategoryIcon, getCategoryStyle } from '@/components/ui/category-icon';
import { LevelBadge, LevelIcon, getLevelStyle } from '@/components/ui/level-icon';
import { GlossaryModal } from '@/components/ui/glossary-modal';
import type { Tutorial, ChecklistItem, TutorialMaterial } from '@/lib/types/database';
import {
  toggleChecklistItem,
  updateChecklistItem,
  resetAllChecklistItems,
  resetSectionChecklistItems,
  checkAllChecklistItems,
  updateChecklistItemsBatch,
  deleteTutorial,
  getOrTranslatePatternAction,
  updateTutorialDetails,
} from '@/app/(dashboard)/library/[id]/actions';
import {
  SUPPORTED_TRANSLATION_LANGUAGES,
  type TranslatedPatternContent,
  type TranslationLanguageInfo,
} from '@/lib/ai/translator';

interface ProjectDetailViewProps {
  tutorial: Tutorial;
  initialItems: ChecklistItem[];
  signedUrl: string | null;
  signedUrls?: string[];
  initialTranslations?: Record<string, TranslatedPatternContent>;
}

/**
 * Visual badge for the total stitch count of a row (e.g. [18]).
 */
function StitchCountBadge({ count }: { count: string }) {
  return (
    <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-sage-100/90 text-sage-900 border border-sage-200/80 shadow-2xs select-none">
      {count}
    </span>
  );
}

/**
 * Formats row text and renders ending stitch count (e.g. [18]) as a visual badge.
 */
function renderWithStitchTerms(text: string) {
  if (!text) return null;

  // Detect stitch count at end of line like [18], [6 ms], or (18 sts)
  const stitchCountMatch = text.match(/(\s*(\[[0-9]+\s*[a-zA-Z]*\]|\([0-9]+\s*[a-zA-Z]*\))\s*)$/);

  if (stitchCountMatch && typeof stitchCountMatch.index === 'number') {
    const mainText = text.substring(0, stitchCountMatch.index);
    const countBadge = stitchCountMatch[2]; // e.g. "[18]" or "(18)"
    return (
      <span>
        {mainText}
        <StitchCountBadge count={countBadge} />
      </span>
    );
  }

  return <span>{text}</span>;
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

function isValidNote(note?: string | null): boolean {
  if (!note) return false;
  const trimmed = note.trim();
  return (
    trimmed !== '' &&
    trimmed.toLowerCase() !== 'null' &&
    trimmed.toLowerCase() !== 'undefined' &&
    trimmed !== 'DEFAULT_NOTE'
  );
}

function cleanNoteValue(note?: string | null): string | null {
  return isValidNote(note) ? note!.trim() : null;
}

function getSourceLanguageInfo(rawLang?: string | null): TranslationLanguageInfo {
  const norm = (rawLang || '').toLowerCase().trim();
  if (norm === 'fr') return { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' };
  if (norm === 'en_uk' || norm === 'uk') return { code: 'en_uk', name: 'English (UK)', nativeName: 'English (UK)', flag: '🇬🇧' };
  if (norm === 'es') return { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' };
  if (norm === 'de') return { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' };
  if (norm === 'ru') return { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' };
  if (norm === 'pt') return { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' };
  if (norm === 'zh') return { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' };
  return { code: 'en_us', name: 'English (US)', nativeName: 'English (US)', flag: '🇺🇸' };
}

interface ZoomableImageViewerProps {
  allImageUrls: string[];
  currentImageIndex: number;
  setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>;
  title: string;
}

function ZoomableImageViewer({
  allImageUrls,
  currentImageIndex,
  setCurrentImageIndex,
  title,
}: ZoomableImageViewerProps) {
  const { t } = useI18n();
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset zoom and pan when changing page
  useEffect(() => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  }, [currentImageIndex]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(3.5, Number((prev + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(1, Number((prev - 0.25).toFixed(2)));
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  // 1-Click Toggle: 100% ➔ 200% ➔ 100% (unless user was dragging/panning)
  const handleClickImage = () => {
    if (hasMoved) return;
    if (zoomLevel === 1) {
      setZoomLevel(2);
    } else {
      handleResetZoom();
    }
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setHasMoved(false);
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setHasMoved(true);
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const currentUrl = allImageUrls[currentImageIndex] || allImageUrls[0];

  return (
    <div className="w-full h-full flex flex-col items-center justify-between gap-2 overflow-hidden select-none bg-yarn-100/60 p-2 sm:p-3">
      {/* Top Toolbar: Clean Zoom Controls */}
      <div className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xs border border-yarn-200 text-xs font-semibold text-yarn-800 z-10">
        <div className="flex items-center">
          {allImageUrls.length > 1 ? (
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-xl bg-yarn-100 text-yarn-800 font-bold border border-yarn-200/60">
              {currentImageIndex + 1} / {allImageUrls.length}
            </span>
          ) : (
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-xl bg-yarn-100 text-yarn-600 font-bold border border-yarn-200/60">
              1 / 1
            </span>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            title="Zoom arrière (-)"
            className="p-1.5 rounded-lg hover:bg-yarn-100 disabled:opacity-30 text-yarn-700 hover:text-yarn-950 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            title="Cliquez pour réinitialiser à 100%"
            className="font-mono text-xs text-yarn-700 min-w-[42px] text-center cursor-pointer hover:text-sage-900 hover:bg-yarn-100 rounded-md font-bold px-1.5 py-0.5 select-none transition-colors"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3.5}
            title="Zoom avant (+)"
            className="p-1.5 rounded-lg hover:bg-yarn-100 disabled:opacity-30 text-yarn-700 hover:text-yarn-950 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {zoomLevel > 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              title="Réinitialiser le zoom"
              className="p-1.5 rounded-lg hover:bg-yarn-100 text-yarn-500 hover:text-yarn-900 transition-colors ml-0.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Zoomable Canvas Area */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClickImage}
        className={`flex-1 w-full relative flex items-center justify-center overflow-hidden rounded-2xl bg-yarn-950/5 border border-yarn-200/60 ${zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
          }`}
      >
        {/* Floating Lateral Chevrons on Image for Fast Clicking */}
        {allImageUrls.length > 1 && (
          <>
            <button
              type="button"
              disabled={currentImageIndex === 0}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => Math.max(0, prev - 1));
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/90 hover:bg-white text-yarn-800 hover:text-sage-900 shadow-soft hover:shadow-lift border border-yarn-200/80 disabled:opacity-0 disabled:pointer-events-none transition-all hover:scale-110 active:scale-95 cursor-pointer"
              title={t.common.previous}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              disabled={currentImageIndex === allImageUrls.length - 1}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => Math.min(allImageUrls.length - 1, prev + 1));
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/90 hover:bg-white text-yarn-800 hover:text-sage-900 shadow-soft hover:shadow-lift border border-yarn-200/80 disabled:opacity-0 disabled:pointer-events-none transition-all hover:scale-110 active:scale-95 cursor-pointer"
              title={t.common.next}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            transformOrigin: 'center center',
          }}
          className="w-full h-full flex items-center justify-center p-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUrl}
            alt={`${title} - Page ${currentImageIndex + 1}`}
            draggable={false}
            className="max-w-full max-h-full object-contain rounded-xl shadow-soft pointer-events-none"
          />
        </div>
      </div>

      {/* Bottom Thumbnails Strip */}
      {allImageUrls.length > 1 && (
        <div className="w-full flex items-center justify-center py-1 px-1 z-10">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 px-2">
            {allImageUrls.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentImageIndex(idx)}
                className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${currentImageIndex === idx
                  ? 'border-sage-700 scale-105 shadow-soft ring-2 ring-sage-200'
                  : 'border-transparent opacity-50 hover:opacity-100 hover:scale-100'
                  }`}
                title={`Page ${idx + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Miniature ${idx + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-0.5 right-0.5 text-[9px] font-mono font-bold px-1 rounded bg-black/60 text-white">
                  {idx + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectDetailView({
  tutorial,
  initialItems,
  signedUrl,
  signedUrls = [],
  initialTranslations = {},
}: ProjectDetailViewProps) {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [showOriginal, setShowOriginal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  const allImageUrls = signedUrls && signedUrls.length > 0 ? signedUrls : (signedUrl ? [signedUrl] : []);

  // Item currently being edited inline
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editNote, setEditNote] = useState('');

  // Delete modal state
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Editable Project Details State
  const [projectTitle, setProjectTitle] = useState(tutorial.title);
  const [projectNote, setProjectNote] = useState(tutorial.note || '');
  const [projectStitch, setProjectStitch] = useState(tutorial.stitch || '');
  const [projectLevel, setProjectLevel] = useState(tutorial.level || '');
  const [projectType, setProjectType] = useState(tutorial.project_type || '');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showSectionsDropdown, setShowSectionsDropdown] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isNoteExpandedMobile, setIsNoteExpandedMobile] = useState(false);
  const [showGlossaryModal, setShowGlossaryModal] = useState(false);

  // Dropdown options for Edit Modal
  const EDIT_LEVEL_OPTIONS = [
    { key: '', label: t.library.allLevels || 'Non spécifié' },
    { key: 'beginner', label: (t.project.levels as any)?.beginner || 'Débutant' },
    { key: 'intermediate', label: (t.project.levels as any)?.intermediate || 'Intermédiaire' },
    { key: 'advanced', label: (t.project.levels as any)?.advanced || 'Avancé' },
  ] as const;

  const EDIT_CATEGORY_OPTIONS = [
    { key: '', label: t.library.filterCategoryAll || 'Non spécifié' },
    { key: 'amigurumi', label: (t.project.projectTypes as any)?.amigurumi || 'Amigurumi' },
    { key: 'accessory', label: (t.project.projectTypes as any)?.accessory || 'Accessoire' },
    { key: 'garment', label: (t.project.projectTypes as any)?.garment || 'Vêtement' },
    { key: 'blanket', label: (t.project.projectTypes as any)?.blanket || 'Plaid / Couverture' },
    { key: 'home', label: (t.project.projectTypes as any)?.home || 'Maison & Déco' },
    { key: 'other', label: (t.project.projectTypes as any)?.other || 'Autre' },
  ] as const;

  // Form input buffer for edit modal
  const [editTitleInput, setEditTitleInput] = useState(tutorial.title);
  const [editNoteInput, setEditNoteInput] = useState(tutorial.note || '');
  const [editStitchInput, setEditStitchInput] = useState(tutorial.stitch || '');
  const [editLevelInput, setEditLevelInput] = useState(tutorial.level || '');
  const [editProjectTypeInput, setEditProjectTypeInput] = useState(tutorial.project_type || '');
  const [showEditLevelDropdown, setShowEditLevelDropdown] = useState(false);
  const [showEditCategoryDropdown, setShowEditCategoryDropdown] = useState(false);

  // Dropdown Refs for reliable click-outside dismissal
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const sectionsDropdownRef = useRef<HTMLDivElement>(null);
  const editCategoryDropdownRef = useRef<HTMLDivElement>(null);
  const editLevelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(target)) {
        setShowLanguageDropdown(false);
      }
      if (sectionsDropdownRef.current && !sectionsDropdownRef.current.contains(target)) {
        setShowSectionsDropdown(false);
      }
      if (editCategoryDropdownRef.current && !editCategoryDropdownRef.current.contains(target)) {
        setShowEditCategoryDropdown(false);
      }
      if (editLevelDropdownRef.current && !editLevelDropdownRef.current.contains(target)) {
        setShowEditLevelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const openEditModal = () => {
    const activeTrans = currentLanguage !== 'original' ? translationsCache[currentLanguage] : null;
    setEditTitleInput(activeTrans?.title || projectTitle);
    setEditNoteInput(
      activeTrans?.note !== undefined && activeTrans?.note !== null
        ? activeTrans.note
        : projectNote
    );
    setEditStitchInput(projectStitch);
    setEditLevelInput(projectLevel);
    setEditProjectTypeInput(projectType);
    setShowEditLevelDropdown(false);
    setShowEditCategoryDropdown(false);
    setIsEditModalOpen(true);
  };

  // Lock body scroll when edit details modal/drawer is open
  useEffect(() => {
    if (isEditModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isEditModalOpen]);

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitleInput.trim()) return;

    setIsSavingDetails(true);
    try {
      await updateTutorialDetails(tutorial.id, {
        title: editTitleInput.trim(),
        note: editNoteInput.trim() || null,
        stitch: editStitchInput.trim() || null,
        level: editLevelInput.trim() || null,
        project_type: editProjectTypeInput.trim() || null,
      });

      setProjectTitle(editTitleInput.trim());
      setProjectNote(editNoteInput.trim());
      setProjectStitch(editStitchInput.trim());
      setProjectLevel(editLevelInput.trim());
      setProjectType(editProjectTypeInput.trim());

      // Synchronize in all cached translations so active language reflects updates instantly
      setTranslationsCache((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((lang) => {
          if (next[lang]) {
            next[lang] = {
              ...next[lang],
              title: editTitleInput.trim(),
              note: editNoteInput.trim() || null,
            };
          }
        });
        return next;
      });

      setIsEditModalOpen(false);

      setTranslationToast({
        message: t.project.detailsSavedToast,
        type: 'success',
      });
      setTimeout(() => setTranslationToast(null), 3000);
    } catch (err) {
      console.error('Error saving project details:', err);
      setTranslationToast({
        message: t.project.detailsSaveError,
        type: 'error',
      });
      setTimeout(() => setTranslationToast(null), 3000);
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Badge tactile pop animation key (increments on every row check)
  const [bumpKey, setBumpKey] = useState(0);

  // Materials Card Collapsible State (open by default, collapses when done or overridden)
  const [materialsOverride, setMaterialsOverride] = useState<boolean | undefined>(undefined);

  // Scroll detection for compact floating reader bar
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Raw Text Content (when source_type === 'text')
  const [rawTextContent, setRawTextContent] = useState<string | null>(null);
  const [isCopiedText, setIsCopiedText] = useState(false);

  useEffect(() => {
    if (tutorial.source_type === 'text' && !rawTextContent) {
      if (signedUrl) {
        fetch(signedUrl)
          .then((res) => {
            if (!res.ok) throw new Error('Failed to fetch text file from storage');
            return res.text();
          })
          .then((text) => {
            if (text && text.trim()) {
              setRawTextContent(text);
            }
          })
          .catch((err) => {
            console.warn('[ProjectDetailView] Error fetching raw text from storage:', err);
            if (tutorial.raw_content && !tutorial.raw_content.startsWith('hash:')) {
              setRawTextContent(tutorial.raw_content);
            }
          });
      } else if (tutorial.raw_content && !tutorial.raw_content.startsWith('hash:')) {
        setRawTextContent(tutorial.raw_content);
      }
    }
  }, [signedUrl, tutorial.source_type, tutorial.raw_content, rawTextContent]);

  // Check if original document or text is viewable
  const hasOriginalDocument = Boolean(
    signedUrl ||
    tutorial.source_type === 'text' ||
    (tutorial.file_path && tutorial.file_path !== 'raw_text') ||
    tutorial.note
  );

  // Supplies checklist state
  const [checkedMaterials, setCheckedMaterials] = useState<Set<number>>(new Set());

  const toggleMaterial = (index: number) => {
    setCheckedMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
        setMaterialsOverride(undefined);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Multi-Language AI Translation State
  // Automatically activate the translated version if it matches the current site locale
  const initialPreferredLanguage = (() => {
    if (locale === 'fr' && initialTranslations?.['fr']) return 'fr';
    if (locale === 'en' && initialTranslations?.['en_us']) return 'en_us';
    return 'original';
  })();

  const [currentLanguage, setCurrentLanguage] = useState<string>(initialPreferredLanguage);
  const [translationsCache, setTranslationsCache] = useState<Record<string, TranslatedPatternContent>>(initialTranslations);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationToast, setTranslationToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState<boolean>(false);

  const handleSelectLanguage = async (langCode: string) => {
    setShowLanguageDropdown(false);
    if (langCode === currentLanguage) return;

    if (langCode === 'original') {
      setCurrentLanguage('original');
      return;
    }

    if (translationsCache[langCode]) {
      setCurrentLanguage(langCode);
      return;
    }

    setIsTranslating(true);
    setTranslationToast({
      message: t.project.translationInProgressToast,
      type: 'info',
    });

    try {
      const res = await getOrTranslatePatternAction(tutorial.id, langCode);
      if (res.success && res.content) {
        setTranslationsCache((prev) => ({
          ...prev,
          [langCode]: res.content,
        }));
        setCurrentLanguage(langCode);
        setTranslationToast({
          message: res.cached ? t.project.translationCachedBadge : t.project.translationSuccessToast,
          type: 'success',
        });
        setTimeout(() => setTranslationToast(null), 3000);
      } else {
        throw new Error(res.error || t.project.translationErrorGeneric);
      }
    } catch (err: any) {
      console.error('[Translation] Error:', err);
      setTranslationToast({
        message: err.message || t.project.translationErrorGeneric,
        type: 'error',
      });
      setTimeout(() => setTranslationToast(null), 4000);
    } finally {
      setIsTranslating(false);
    }
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

  // Handle start inline edit for a step (instructions + note)
  const handleStartEditItem = (item: { id: string; label: string; note?: string | null }) => {
    setEditingItemId(item.id);
    setEditLabel(item.label);
    setEditNote(item.note || '');
  };

  // Handle save step (instructions + note)
  const handleSaveItem = (itemId: string) => {
    if (!editLabel.trim()) return;

    const trimmedLabel = editLabel.trim();
    const trimmedNote = editNote.trim() || null;

    const updated = items.map((i) =>
      i.id === itemId
        ? { ...i, label: trimmedLabel, note: trimmedNote, edited_by_user: true }
        : i
    );
    setItems(updated);
    setEditingItemId(null);

    startTransition(async () => {
      try {
        await updateChecklistItem(itemId, trimmedLabel, trimmedNote);
      } catch (err) {
        console.error('Failed to update step:', err);
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditLabel('');
    setEditNote('');
  };

  // Handle delete item
  const handleDeleteItem = (itemId: string) => {
    const updated = items.filter((i) => i.id !== itemId);
    setItems(updated);
  };

  // Handle check all items globally
  const handleCheckAll = (e?: React.MouseEvent) => {
    setItems((prev) => prev.map((i) => ({ ...i, checked: true })));
    setBumpKey((k) => k + 1);
    triggerGrandConfetti();

    startTransition(async () => {
      try {
        await checkAllChecklistItems(tutorial.id);
      } catch (err) {
        console.error('Failed to check all:', err);
      }
    });
  };

  // Handle reset all items globally
  const handleResetAll = () => {
    setItems((prev) => prev.map((i) => ({ ...i, checked: false })));
    setSectionOverrides({});
    setCheckedMaterials(new Set());
    setMaterialsOverride(undefined);
    setBumpKey((k) => k + 1);

    startTransition(async () => {
      try {
        await resetAllChecklistItems(tutorial.id);
      } catch (err) {
        console.error('Failed to reset all:', err);
      }
    });
  };

  // Handle check all items in a specific section / sub-section
  const handleCheckSection = (targetItems: ChecklistItem[], e?: React.MouseEvent) => {
    const itemIds = targetItems.map((i) => i.id);
    const idSet = new Set(itemIds);
    setItems((prev) =>
      prev.map((i) => (idSet.has(i.id) ? { ...i, checked: true } : i))
    );
    setBumpKey((k) => k + 1);
    triggerStepConfetti(e);

    startTransition(async () => {
      try {
        await updateChecklistItemsBatch(tutorial.id, itemIds, true);
      } catch (err) {
        console.error('Failed to check section items:', err);
      }
    });
  };

  // Handle reset all items in a specific section / sub-section
  const handleResetSection = (targetItems: ChecklistItem[]) => {
    const itemIds = targetItems.map((i) => i.id);
    const idSet = new Set(itemIds);
    setItems((prev) =>
      prev.map((i) => (idSet.has(i.id) ? { ...i, checked: false } : i))
    );
    setBumpKey((k) => k + 1);

    startTransition(async () => {
      try {
        await updateChecklistItemsBatch(tutorial.id, itemIds, false);
      } catch (err) {
        console.error('Failed to reset section items:', err);
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

  // Merge translated step labels, section names, and notes if active translation is selected
  const activeTranslation = currentLanguage !== 'original' ? translationsCache[currentLanguage] : null;

  const displayItems = activeTranslation
    ? items.map((item) => {
      const transStep = activeTranslation.steps.find((s) => s.order_index === item.order_index);
      if (transStep) {
        const rawNote = item.edited_by_user
          ? item.note
          : (transStep.note !== undefined && transStep.note !== null ? transStep.note : item.note);
        return {
          ...item,
          label: item.edited_by_user ? item.label : transStep.label,
          section: transStep.section || item.section,
          note: cleanNoteValue(rawNote),
        };
      }
      return {
        ...item,
        note: cleanNoteValue(item.note),
      };
    })
    : items.map((item) => ({
      ...item,
      note: cleanNoteValue(item.note),
    }));

  // Group checklist items by section and automatically group pairs/multiples
  const rawSectionsMap = displayItems.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
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

  const rawMaterialsList = (Array.isArray(tutorial.materials)
    ? tutorial.materials
    : []) as TutorialMaterial[];

  const materialsList = (activeTranslation?.materials && activeTranslation.materials.length > 0)
    ? activeTranslation.materials
    : rawMaterialsList;

  // Active translated title and note (if translating)
  const displayTitle = activeTranslation?.title || projectTitle;
  const displayNote = (activeTranslation?.note !== undefined && activeTranslation?.note !== null)
    ? activeTranslation.note
    : projectNote;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 transition-all duration-300">
      {/* Unified Sticky Reader Bar (Applies transform scale & elevated shadow dynamically when sticky/scrolled) */}
      <div
        className={`sticky top-2 sm:top-3 z-30 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-2xl border border-yarn-200/90 space-y-3 sm:space-y-3.5 transition-all duration-300 ease-out ${
          isScrolled
            ? 'transform scale-[1.015] sm:scale-[1.02] shadow-2xl ring-1 ring-black/[0.08]'
            : 'scale-100 shadow-lift ring-1 ring-black/[0.04]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3.5">
          {/* Left: Quick Back + Badges above Title + Project Title + Counters */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <Link
              href="/library"
              title={t.project.backToLibrary}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-yarn-100/80 hover:bg-yarn-200 text-yarn-800 hover:text-yarn-950 transition-all shrink-0 inline-flex items-center justify-center border border-yarn-200/90 shadow-2xs hover:scale-105 active:scale-95 p-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <h1 className="text-sm sm:text-xl font-bold font-serif text-yarn-950 tracking-tight truncate">
                  {displayTitle}
                </h1>

                {/* Compact Icon-Only Category & Level Badges */}
                {projectType && (
                  <span
                    title={(t.project.projectTypes as any)?.[projectType.toLowerCase()] || projectType}
                    className={`h-6 w-6 rounded-lg inline-flex items-center justify-center border shadow-2xs shrink-0 ${getCategoryStyle(projectType).badgeClass}`}
                  >
                    <CategoryIcon
                      category={projectType}
                      className={`w-3.5 h-3.5 ${getCategoryStyle(projectType).iconColor}`}
                    />
                  </span>
                )}
                {projectLevel && (
                  <span
                    title={(t.project.levels as any)?.[projectLevel.toLowerCase()] || projectLevel}
                    className={`h-6 w-6 rounded-lg inline-flex items-center justify-center border shadow-2xs shrink-0 ${getLevelStyle(projectLevel).badgeClass}`}
                  >
                    <LevelIcon
                      level={projectLevel}
                      className={`w-3.5 h-3.5 ${getLevelStyle(projectLevel).iconColor}`}
                    />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-yarn-600">
                <span
                  className={`truncate font-bold ${isAllDone
                    ? 'text-emerald-700'
                    : progressPercent > 0
                      ? 'text-orange-500'
                      : 'text-rose-600'
                    }`}
                >
                  {completedCount} / {totalItems} {t.project.roundsCompleted}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons (Responsive Toolbar - 100% visible on mobile, no clipping) */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto shrink-0">
            {/* Language & Technical Translation Switcher Dropdown */}
            {(() => {
              const sourceLang = getSourceLanguageInfo(tutorial.raw_content_language);
              const isViewingOriginal = currentLanguage === 'original' || currentLanguage === sourceLang.code;
              const activeLangInfo = isViewingOriginal
                ? sourceLang
                : SUPPORTED_TRANSLATION_LANGUAGES.find((l) => l.code === currentLanguage) || sourceLang;

              return (
                <div ref={languageDropdownRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    disabled={isTranslating}
                    className={`h-9 sm:h-10 inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 rounded-xl sm:rounded-2xl text-xs font-bold border transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${!isViewingOriginal
                      ? 'bg-sage-100 text-sage-900 border-sage-300 shadow-xs'
                      : 'bg-white text-yarn-800 hover:bg-yarn-100 border-yarn-300'
                      }`}
                    title={t.project.translationTitle}
                  >
                    {isTranslating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sage-700" />
                    ) : (
                      <span className="text-sm leading-none">{activeLangInfo.flag}</span>
                    )}
                    <span className="hidden md:inline">
                      {(t.project.languageNames as any)?.[activeLangInfo.code] || activeLangInfo.nativeName}
                    </span>
                    <ChevronDown className="w-3 h-3 text-yarn-500" />
                  </button>

                  {/* Floating Dropdown Menu (Compact, content-fitted, no scrollbar, responsive alignment) */}
                  {showLanguageDropdown && (
                    <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 sm:w-52 max-w-[calc(100vw-2rem)] rounded-2xl bg-white border border-yarn-200 shadow-2xl p-1.5 z-50 animate-fadeIn">
                      {/* Source Language Option */}
                      <div className="px-2.5 py-1 text-[10px] font-bold text-yarn-400 uppercase tracking-wider">
                        {t.project.originalLanguage}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectLanguage('original')}
                        className={`w-full text-left px-2.5 py-1.5 text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${isViewingOriginal ? 'font-bold text-sage-900 bg-sage-50' : 'text-yarn-800 hover:bg-yarn-50'
                          }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="text-sm shrink-0">{sourceLang.flag}</span>
                          <span className="truncate font-medium">
                            {(t.project.languageNames as any)?.[sourceLang.code] || sourceLang.nativeName}
                          </span>
                        </span>
                        {isViewingOriginal && <Check className="w-3.5 h-3.5 text-sage-700 shrink-0 ml-1.5" />}
                      </button>

                      <div className="h-px bg-yarn-100 my-1" />

                      {/* Supported Languages (Excluding Source Language) */}
                      <div className="px-2.5 py-1 text-[10px] font-bold text-yarn-400 uppercase tracking-wider">
                        {t.project.translateTo}
                      </div>

                      <div className="space-y-0.5">
                        {SUPPORTED_TRANSLATION_LANGUAGES.filter((lang) => lang.code !== sourceLang.code).map((lang) => {
                          const isSelected = currentLanguage === lang.code;
                          const isCached = !!translationsCache[lang.code];
                          return (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={() => handleSelectLanguage(lang.code)}
                              className={`w-full text-left px-2.5 py-1.5 text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${isSelected ? 'font-bold text-sage-900 bg-sage-50' : 'text-yarn-800 hover:bg-yarn-50'
                                }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <span className="text-sm shrink-0">{lang.flag}</span>
                                <span className="truncate">
                                  {(t.project.languageNames as any)?.[lang.code] || lang.nativeName}
                                </span>
                              </span>
                              <span className="flex items-center gap-1 shrink-0 ml-1.5">
                                {isCached && !isSelected && (
                                  <span
                                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-2xs"
                                    title={t.project.translationCachedBadge}
                                  />
                                )}
                                {isSelected && <Check className="w-3.5 h-3.5 text-sage-700" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Toggle PDF / Original Image / Original Text button */}
            {hasOriginalDocument && (
              <button
                type="button"
                onClick={() => setShowOriginal(!showOriginal)}
                className={`h-9 w-9 sm:h-10 sm:w-auto inline-flex items-center justify-center gap-1.5 sm:px-3.5 rounded-xl sm:rounded-2xl text-xs font-bold border transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${showOriginal
                  ? 'bg-sage-800 text-white border-sage-900 shadow-soft'
                  : 'bg-white text-yarn-800 hover:bg-yarn-100 border-yarn-300'
                  }`}
                title={showOriginal ? t.project.hideOriginalPattern : t.project.originalPattern}
              >
                {showOriginal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">
                  {showOriginal ? t.project.hideOriginalPattern : t.project.originalPattern}
                </span>
              </button>
            )}

            {/* Sections Quick Navigation Dropdown */}
            {sectionGroups.length > 0 && (
              <div ref={sectionsDropdownRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowLanguageDropdown(false);
                    setShowSectionsDropdown((prev) => !prev);
                  }}
                  className={`h-9 sm:h-10 inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 rounded-xl sm:rounded-2xl text-xs font-bold border transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${showSectionsDropdown
                    ? 'bg-sage-100 text-sage-900 border-sage-300 shadow-xs'
                    : 'bg-white text-yarn-800 hover:bg-yarn-100 border-yarn-300'
                    }`}
                  title={t.project.sectionsDropdown || 'Sections du patron'}
                >
                  <Layers className="w-3.5 h-3.5 text-sage-700 shrink-0" />
                  <span className="hidden md:inline">{t.project.sectionsDropdown || 'Sections'}</span>
                  <span className="font-mono text-[10px] sm:text-[11px] font-bold text-sage-700 bg-sage-50 px-1 sm:px-1.5 py-0.5 rounded-md border border-sage-200 shrink-0">
                    {sectionGroups.filter((g) => g.completedCount === g.totalCount && g.totalCount > 0).length}/{sectionGroups.length}
                  </span>
                  <ChevronDown className="w-3 h-3 text-yarn-500 hidden sm:inline" />
                </button>

                {showSectionsDropdown && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-64 sm:w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-white border border-yarn-200 shadow-2xl p-1.5 z-50 animate-fadeIn">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold text-yarn-400 uppercase tracking-wider">
                      {t.project.sectionsProgress || 'Progression par section'}
                    </div>

                    <div className="space-y-0.5 max-h-72 overflow-y-auto">
                      {sectionGroups.map((group) => {
                        const isGroupDone = group.completedCount === group.totalCount && group.totalCount > 0;
                        const percent = group.totalCount > 0 ? Math.round((group.completedCount / group.totalCount) * 100) : 0;
                        return (
                          <button
                            key={group.groupTitle}
                            type="button"
                            onClick={() => {
                              // Force open section accordion
                              setSectionOverrides((prev) => ({
                                ...prev,
                                [group.groupTitle]: true,
                              }));
                              setShowSectionsDropdown(false);
                              // Smooth scroll to section element accounting for sticky header height
                              setTimeout(() => {
                                const el = document.getElementById(`section-group-${encodeURIComponent(group.groupTitle)}`);
                                if (el) {
                                  const stickyHeader = document.querySelector('.sticky');
                                  const headerHeight = stickyHeader ? stickyHeader.getBoundingClientRect().height : 100;
                                  const elementPosition = el.getBoundingClientRect().top + window.scrollY;
                                  const offsetPosition = elementPosition - headerHeight - 16;

                                  window.scrollTo({
                                    top: Math.max(0, offsetPosition),
                                    behavior: 'smooth',
                                  });
                                }
                              }, 100);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-yarn-50 text-yarn-900 transition-colors cursor-pointer flex items-center justify-between gap-2.5"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 truncate font-semibold">
                                <span className="truncate">{group.groupTitle}</span>
                                {group.isMultiple && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-yarn-100 text-yarn-700 border border-yarn-200 shrink-0">
                                    x{group.subSections.length}
                                  </span>
                                )}
                              </div>
                              {/* Mini progress bar */}
                              <div className="w-full bg-yarn-200/80 h-1 rounded-full overflow-hidden mt-1.5">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${isGroupDone ? 'bg-emerald-500' : percent > 0 ? 'bg-orange-400' : 'bg-transparent'
                                    }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 text-right">
                              <span className="font-mono text-[11px] font-bold text-yarn-600">
                                {group.completedCount}/{group.totalCount}
                              </span>
                              {isGroupDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <span
                                  className={`w-4 h-4 text-[10px] font-mono flex items-center justify-center ${percent > 0 ? 'text-orange-500 font-bold' : 'text-rose-500 font-bold'
                                    }`}
                                >
                                  {percent}%
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Glossary Modal Button */}
            <button
              type="button"
              onClick={() => setShowGlossaryModal(true)}
              title={t.project.glossaryButton}
              className="h-9 w-9 sm:h-10 sm:w-auto sm:px-3 rounded-xl sm:rounded-2xl bg-white hover:bg-yarn-100 border border-yarn-300 text-yarn-700 hover:text-yarn-950 transition-all shadow-2xs hover:scale-105 active:scale-95 shrink-0 inline-flex items-center justify-center gap-1.5 cursor-pointer font-bold text-xs sm:text-sm"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sage-700 shrink-0" />
              <span className="hidden md:inline">{t.project.glossaryButton}</span>
            </button>

            {/* Edit Project Details Button */}
            <button
              type="button"
              onClick={openEditModal}
              title={t.project.editDetails}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-white hover:bg-yarn-100 border border-yarn-300 text-yarn-700 hover:text-yarn-950 transition-all shadow-2xs hover:scale-105 active:scale-95 shrink-0 inline-flex items-center justify-center p-0 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Check All Checkboxes Button */}
            <button
              type="button"
              onClick={handleCheckAll}
              title={t.project.checkAll}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-white hover:bg-emerald-50 border border-yarn-300 hover:border-emerald-300 text-emerald-600 hover:text-emerald-700 transition-all shadow-2xs hover:scale-105 active:scale-95 shrink-0 inline-flex items-center justify-center p-0 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
            </button>

            {/* Reset All Checkboxes Button */}
            <button
              type="button"
              onClick={handleResetAll}
              title={t.project.uncheckAll}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-white hover:bg-rose-50 border border-yarn-300 hover:border-rose-200 text-yarn-700 hover:text-rose-700 transition-all shadow-2xs hover:scale-105 active:scale-95 shrink-0 inline-flex items-center justify-center p-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            </button>
          </div>
        </div>

        {/* Description & Notes (integrated in progress card, automatically collapses when scrolling) */}
        {displayNote && (
          <div
            className={`transition-all duration-300 ease-out overflow-hidden ${isScrolled
              ? 'max-h-0 opacity-0 my-0 py-0 pointer-events-none'
              : 'max-h-96 opacity-100 pt-2.5 sm:pt-3 border-t border-yarn-100'
              }`}
          >
            <p className={`text-xs sm:text-sm text-yarn-700 leading-relaxed whitespace-pre-wrap ${!isNoteExpandedMobile ? 'line-clamp-2 sm:line-clamp-none' : ''}`}>
              {displayNote}
            </p>
            {displayNote.length > 90 && (
              <button
                type="button"
                onClick={() => setIsNoteExpandedMobile((prev) => !prev)}
                className="sm:hidden text-[11px] font-bold text-sage-800 hover:text-sage-950 mt-1 inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>{isNoteExpandedMobile ? t.project.showLess : t.project.showMore}</span>
              </button>
            )}
          </div>
        )}

        {/* Prominent Glow Progress Track + Percentage on the right */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 w-full pt-0.5">
          <div className="flex-1 h-2 sm:h-2.5 rounded-full bg-yarn-100 overflow-hidden border border-yarn-200/90 shadow-inner p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${isAllDone
                ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/20'
                : progressPercent > 0
                  ? 'bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 shadow-sm shadow-orange-500/20'
                  : 'bg-rose-300'
                }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <span
            key={`badge-progress-${bumpKey}`}
            className={`text-xs sm:text-sm font-extrabold font-mono shrink-0 min-w-[2.75rem] text-right transition-all ${bumpKey > 0 ? 'animate-badge-pop' : ''
              } ${isAllDone
                ? 'text-emerald-700'
                : progressPercent > 0
                  ? 'text-orange-600'
                  : 'text-rose-600'
              }`}
          >
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Main Project Content (Split view on Desktop: 50/50 Desktop, Checklist full width on Mobile) */}
      <div className={`grid gap-8 ${showOriginal ? 'lg:grid-cols-2 items-start' : 'grid-cols-1'}`}>
        {/* Checklist & Pattern Details Column */}
        <div className="space-y-8 w-full">
          {/* Materials Checklist Card (Open by default, auto-collapses when done) */}
          {(materialsList.length > 0 || projectStitch || tutorial.stitch) && (() => {
            const isMaterialsDone = materialsList.length > 0 && checkedMaterials.size === materialsList.length;
            const isMaterialsCollapsed = materialsOverride !== undefined
              ? materialsOverride
              : isMaterialsDone;

            return (
              <div
                className={`rounded-3xl bg-white border border-yarn-200 shadow-soft transition-all duration-200 ${isMaterialsCollapsed ? 'p-4 sm:p-5' : 'p-5 sm:p-6 space-y-4'
                  }`}
              >
                <div
                  onClick={() => setMaterialsOverride(!isMaterialsCollapsed)}
                  className={`flex items-center justify-between gap-3 flex-wrap cursor-pointer select-none group ${isMaterialsCollapsed ? '' : 'border-b border-yarn-100 pb-3'
                    }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Volleyball className="w-4 h-4 text-sage-700 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold font-serif text-yarn-950 group-hover:text-sage-900 transition-colors">
                          {t.project.materialsTitle}
                        </h2>
                        {isMaterialsDone && isMaterialsCollapsed && (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 animate-in fade-in shrink-0">
                            {t.project.materialsReadyBadge || 'Prêt ✓'}
                          </span>
                        )}
                        {!isMaterialsDone && isMaterialsCollapsed && materialsList.length > 0 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yarn-100 text-yarn-700">
                            {checkedMaterials.size}/{materialsList.length}
                          </span>
                        )}
                      </div>
                      {materialsList.length > 0 && !isMaterialsCollapsed && (
                        <p className="text-[11px] font-medium text-yarn-500">
                          {checkedMaterials.size} / {materialsList.length}{' '}
                          {t.project.materialsReadyPlural || 'prêts'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(projectStitch || tutorial.stitch) && (
                      <div className="flex items-center gap-1.5 text-xs text-yarn-700 bg-yarn-50 px-3 py-1.5 rounded-xl border border-yarn-200 shadow-2xs shrink-0">
                        <span className="font-semibold text-yarn-900">{t.project.materialsHook} :</span>
                        <span className="font-mono font-bold text-sage-800">{projectStitch || tutorial.stitch}</span>
                      </div>
                    )}

                    <div className="p-1 text-yarn-400 group-hover:text-yarn-800 transition-colors">
                      <ChevronDown
                        className={`w-5 h-5 transition-transform duration-200 ${isMaterialsCollapsed ? '-rotate-90' : 'rotate-0'
                          }`}
                      />
                    </div>
                  </div>
                </div>

                {!isMaterialsCollapsed && materialsList.length > 0 && (
                  <div className="space-y-2 animate-in fade-in duration-200">
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
            );
          })()}

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
                      id={`section-group-${encodeURIComponent(group.groupTitle)}`}
                      className={`rounded-3xl bg-white border border-yarn-200 shadow-soft transition-all scroll-mt-36 sm:scroll-mt-44 ${isCollapsed ? 'p-3.5 sm:p-5' : 'p-4 sm:p-6 lg:p-7 space-y-5 sm:space-y-6'
                        }`}
                    >
                      {/* Master Multi-Part Header (e.g. Jambes, Bras, Oreilles) */}
                      <div
                        onClick={() => toggleSection(group.groupTitle, isGroupDone)}
                        className={`flex items-center justify-between gap-2 min-w-0 cursor-pointer select-none transition-colors ${isCollapsed ? '' : 'border-b border-yarn-200/80 pb-3 sm:pb-4'
                          }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Layers className="w-4 h-4 text-sage-700 shrink-0" />
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                            <h2 className="text-sm sm:text-base lg:text-lg font-bold font-serif text-yarn-950 truncate">
                              {group.groupTitle}
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yarn-100 text-yarn-800 border border-yarn-200 shrink-0">
                              x{group.subSections.length}
                            </span>
                            {isGroupDone && isCollapsed && (
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 animate-in fade-in shrink-0">
                                {t.project.sectionCompletedBadge || 'Terminé ✓'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          {group.completedCount < group.totalCount && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckSection(group.subSections.flatMap((s) => s.items), e);
                              }}
                              title={t.project.checkSection}
                              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-yarn-200 hover:border-emerald-300 text-emerald-700 font-bold text-xs shadow-2xs inline-flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                            >
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="hidden sm:inline">{t.project.checkSection}</span>
                            </button>
                          )}
                          {group.completedCount > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResetSection(group.subSections.flatMap((s) => s.items));
                              }}
                              title={t.project.resetSection}
                              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-yarn-200 hover:border-rose-300 text-rose-600 hover:text-rose-700 font-bold text-xs shadow-2xs inline-flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span className="hidden sm:inline">{t.project.resetSection}</span>
                            </button>
                          )}
                          <span
                            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl border ${isGroupDone
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'text-yarn-700 bg-yarn-50 border-yarn-200'
                              }`}
                          >
                            {group.completedCount} / {group.totalCount}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-yarn-500 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'
                              }`}
                          />
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          {/* Multi-part micro-progress track */}
                          <div className="w-full h-1.5 bg-yarn-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${isGroupDone ? 'bg-emerald-500' : 'bg-sage-600'
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
                                    <div className="flex items-center justify-between gap-2 min-w-0">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span
                                          className={`w-2 h-2 rounded-full shrink-0 ${isSubDone ? 'bg-emerald-500' : 'bg-sage-600'
                                            }`}
                                        />
                                        <h3 className="text-sm font-bold font-serif text-yarn-900 truncate">
                                          {sub.subTitle}
                                        </h3>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {!isSubDone && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCheckSection(sub.items, e);
                                            }}
                                            title={t.project.checkSection}
                                            className="h-7 px-2 rounded-lg bg-white hover:bg-emerald-50 border border-yarn-200 hover:border-emerald-300 text-emerald-700 font-bold text-[11px] inline-flex items-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                                          >
                                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                            <span className="hidden xs:inline">{t.project.checkSection}</span>
                                          </button>
                                        )}
                                        {subCompleted > 0 && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleResetSection(sub.items);
                                            }}
                                            title={t.project.resetSection}
                                            className="h-7 w-7 rounded-lg bg-white hover:bg-rose-50 border border-yarn-200 hover:border-rose-300 text-rose-600 hover:text-rose-700 font-bold text-xs inline-flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs shrink-0"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                                          </button>
                                        )}
                                        <span
                                          className={`h-7 px-2 text-xs font-mono font-bold rounded-lg border inline-flex items-center justify-center shrink-0 ${isSubDone
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
                                        className={`h-full transition-all duration-300 rounded-full ${isSubDone ? 'bg-emerald-500' : 'bg-sage-600'
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
                                          if (editingItemId !== item.id) {
                                            handleToggle(item.id, e);
                                          }
                                        }}
                                        className={`group p-3 rounded-xl border transition-all cursor-pointer select-none ${item.checked
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
                                                className="space-y-2.5 p-3 rounded-2xl bg-yarn-50 border border-yarn-200"
                                              >
                                                <div>
                                                  <label className="block text-[11px] font-bold text-yarn-700 mb-1">
                                                    {t.project.editStepInstructionsLabel}
                                                  </label>
                                                  <input
                                                    type="text"
                                                    value={editLabel}
                                                    onChange={(e) => setEditLabel(e.target.value)}
                                                    className="w-full px-3 py-1.5 rounded-xl border border-yarn-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sage-500 focus:outline-none bg-white text-yarn-900 shadow-2xs"
                                                  />
                                                </div>

                                                <div>
                                                  <label className="block text-[11px] font-bold text-yarn-700 mb-1">
                                                    {t.project.editStepNoteLabel}
                                                  </label>
                                                  <input
                                                    type="text"
                                                    value={editNote}
                                                    placeholder={t.project.notePlaceholder}
                                                    onChange={(e) => setEditNote(e.target.value)}
                                                    className="w-full px-3 py-1.5 rounded-xl border border-yarn-300 text-xs sm:text-sm focus:ring-2 focus:ring-sage-500 focus:outline-none bg-white text-yarn-800 shadow-2xs"
                                                  />
                                                </div>

                                                <div className="flex items-center justify-end gap-2 pt-0.5">
                                                  <button
                                                    type="button"
                                                    onClick={handleCancelEdit}
                                                    className="px-3 py-1 rounded-lg border border-yarn-300 bg-white hover:bg-yarn-100 text-yarn-700 text-xs font-semibold transition-all cursor-pointer"
                                                  >
                                                    {t.project.cancelEdit}
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleSaveItem(item.id)}
                                                    className="px-3 py-1 rounded-lg bg-sage-800 hover:bg-sage-900 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                                                  >
                                                    {t.project.saveStep}
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              <>
                                                <div className="flex items-start justify-between gap-1.5">
                                                  <div
                                                    className={`text-xs sm:text-sm font-medium leading-relaxed ${item.checked ? 'line-through text-yarn-500' : 'text-yarn-900'
                                                      }`}
                                                  >
                                                    {renderWithStitchTerms(item.label)}
                                                  </div>

                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleStartEditItem(item);
                                                    }}
                                                    title={t.project.editStep}
                                                    className="p-1 rounded-lg text-yarn-400 hover:text-yarn-700 hover:bg-yarn-100 active:bg-yarn-200 transition-colors shrink-0 cursor-pointer"
                                                  >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                  </button>
                                                </div>

                                                {isValidNote(item.note) && (
                                                  <div className="mt-1.5 text-[11px] sm:text-xs text-sage-900 bg-sage-50/90 border border-sage-200/80 rounded-xl px-2.5 py-1.5 flex items-start gap-1.5 w-fit max-w-full pointer-events-none">
                                                    <MessageSquare className="w-3 h-3 text-sage-600 shrink-0 mt-0.5" />
                                                    <span className="break-words leading-relaxed">{item.note}</span>
                                                  </div>
                                                )}
                                              </>
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
                    id={`section-group-${encodeURIComponent(group.groupTitle)}`}
                    className={`rounded-3xl bg-white border border-yarn-200 shadow-soft transition-all scroll-mt-36 sm:scroll-mt-44 ${isCollapsed ? 'p-3.5 sm:p-5' : 'p-4 sm:p-6 lg:p-7 space-y-4 sm:space-y-5'
                      }`}
                  >
                    {/* Section Header */}
                    <div
                      onClick={() => toggleSection(group.groupTitle, isDone)}
                      className={`cursor-pointer select-none transition-colors ${isCollapsed ? '' : 'space-y-2.5 sm:space-y-3 border-b border-yarn-100 pb-2.5 sm:pb-3'
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
                                {t.project.sectionCompletedBadge || 'Terminé ✓'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          {group.completedCount < group.totalCount && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckSection(sub.items, e);
                              }}
                              title={t.project.checkSection}
                              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-yarn-200 hover:border-emerald-300 text-emerald-700 font-bold text-xs shadow-2xs inline-flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                            >
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="hidden sm:inline">{t.project.checkSection}</span>
                            </button>
                          )}
                          {group.completedCount > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResetSection(sub.items);
                              }}
                              title={t.project.resetSection}
                              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-yarn-200 hover:border-rose-300 text-rose-600 hover:text-rose-700 font-bold text-xs shadow-2xs inline-flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span className="hidden sm:inline">{t.project.resetSection}</span>
                            </button>
                          )}
                          <span
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${isDone
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'text-yarn-600 bg-yarn-50 border-yarn-200'
                              }`}
                          >
                            {group.completedCount} / {group.totalCount}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-yarn-500 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'
                              }`}
                          />
                        </div>
                      </div>

                      {!isCollapsed && (
                        /* Standalone section micro-progress track */
                        <div className="w-full h-1.5 bg-yarn-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${isDone ? 'bg-emerald-500' : 'bg-sage-600'
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
                              if (editingItemId !== item.id) {
                                handleToggle(item.id, e);
                              }
                            }}
                            className={`group p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${item.checked
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
                                    className="space-y-2.5 p-3 rounded-2xl bg-yarn-50 border border-yarn-200"
                                  >
                                    <div>
                                      <label className="block text-[11px] font-bold text-yarn-700 mb-1">
                                        {t.project.editStepInstructionsLabel}
                                      </label>
                                      <input
                                        type="text"
                                        value={editLabel}
                                        onChange={(e) => setEditLabel(e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-xl border border-yarn-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sage-500 focus:outline-none bg-white text-yarn-900 shadow-2xs"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-bold text-yarn-700 mb-1">
                                        {t.project.editStepNoteLabel}
                                      </label>
                                      <input
                                        type="text"
                                        value={editNote}
                                        placeholder={t.project.notePlaceholder}
                                        onChange={(e) => setEditNote(e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-xl border border-yarn-300 text-xs sm:text-sm focus:ring-2 focus:ring-sage-500 focus:outline-none bg-white text-yarn-800 shadow-2xs"
                                      />
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-0.5">
                                      <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="px-3 py-1 rounded-lg border border-yarn-300 bg-white hover:bg-yarn-100 text-yarn-700 text-xs font-semibold transition-all cursor-pointer"
                                      >
                                        {t.project.cancelEdit}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveItem(item.id)}
                                        className="px-3 py-1 rounded-lg bg-sage-800 hover:bg-sage-900 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                                      >
                                        {t.project.saveStep}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-start justify-between gap-2">
                                      <div
                                        className={`text-sm font-medium leading-relaxed ${item.checked ? 'line-through text-yarn-500' : 'text-yarn-900'
                                          }`}
                                      >
                                        {renderWithStitchTerms(item.label)}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStartEditItem(item);
                                        }}
                                        title={t.project.editStep}
                                        className="p-1 rounded-lg text-yarn-400 hover:text-yarn-700 hover:bg-yarn-100 active:bg-yarn-200 transition-colors shrink-0 cursor-pointer"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {isValidNote(item.note) && (
                                      <div className="mt-1.5 text-[11px] sm:text-xs text-sage-900 bg-sage-50/90 border border-sage-200/80 rounded-xl px-2.5 py-1.5 flex items-start gap-1.5 w-fit max-w-full pointer-events-none">
                                        <MessageSquare className="w-3 h-3 text-sage-600 shrink-0 mt-0.5" />
                                        <span className="break-words leading-relaxed">{item.note}</span>
                                      </div>
                                    )}
                                  </>
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

        {/* Desktop Side-by-Side PDF / Image / Text Viewer (50% on Desktop, hidden on Mobile) */}
        {hasOriginalDocument && (
          <div
            className={`hidden ${showOriginal ? 'lg:flex' : 'lg:hidden'
              } w-full lg:h-[calc(100vh-160px)] lg:sticky lg:top-[140px] z-20 rounded-3xl bg-white border border-yarn-300 shadow-lift overflow-hidden flex-col animate-in fade-in duration-200`}
          >
            <div className="p-4 border-b border-yarn-200 bg-yarn-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-yarn-800">
                <FileText className="w-4 h-4 text-sage-700" />
                <span>
                  {tutorial.source_type === 'pdf'
                    ? t.project.originalPdf
                    : tutorial.source_type === 'text'
                      ? t.project.originalText
                      : t.project.originalImages}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {signedUrl && (
                  <a
                    href={signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-sage-700 hover:text-sage-900 font-semibold"
                  >
                    <span>{t.project.openInNewTab}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
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

            <div className="flex-1 w-full bg-yarn-100 relative overflow-hidden">
              {tutorial.source_type === 'pdf' && signedUrl ? (
                <iframe
                  src={`${signedUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-none"
                  title="PDF Viewer Desktop"
                />
              ) : tutorial.source_type === 'text' ? (
                <div className="w-full h-full overflow-auto p-5 sm:p-6 bg-white flex flex-col">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-yarn-100 text-xs text-yarn-600">
                    <span className="font-semibold text-yarn-800">{t.project.originalText}</span>
                    {rawTextContent && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(rawTextContent);
                          setIsCopiedText(true);
                          setTimeout(() => setIsCopiedText(false), 2000);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sage-700 hover:text-sage-900 transition-colors px-2 py-1 rounded-lg hover:bg-yarn-50"
                      >
                        {isCopiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopiedText ? 'Copié !' : 'Copier'}</span>
                      </button>
                    )}
                  </div>
                  <div className="flex-1 font-mono text-xs sm:text-sm text-yarn-900 leading-relaxed whitespace-pre-wrap selection:bg-sage-200">
                    {rawTextContent || (
                      <div className="flex items-center justify-center h-48 text-yarn-500 gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-sage-600" />
                        <span>Chargement du texte...</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : allImageUrls.length > 0 ? (
                <ZoomableImageViewer
                  allImageUrls={allImageUrls}
                  currentImageIndex={currentImageIndex}
                  setCurrentImageIndex={setCurrentImageIndex}
                  title={tutorial.title}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-yarn-500 gap-3">
                  <FileText className="w-10 h-10 text-yarn-400 stroke-1" />
                  <p className="text-sm font-medium">Document original non disponible</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Slide-Up Bottom Sheet Drawer (Retains PDF page & scroll position permanently) */}
      {hasOriginalDocument && (
        <div
          className={`lg:hidden fixed inset-0 z-50 flex flex-col justify-end transition-all duration-300 ${showOriginal ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'
            }`}
        >
          {/* Backdrop with blur */}
          <div
            className={`fixed inset-0 bg-yarn-950/60 backdrop-blur-sm transition-opacity duration-300 ${showOriginal ? 'opacity-100' : 'opacity-0'
              }`}
            onClick={() => setShowOriginal(false)}
          />

          {/* Sheet Modal Container */}
          <div
            className={`relative w-full h-[88vh] max-h-[88vh] bg-white rounded-t-3xl border-t border-yarn-300 shadow-2xl flex flex-col overflow-hidden z-10 transition-transform duration-300 ease-out ${showOriginal ? 'translate-y-0' : 'translate-y-full'
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
                    : tutorial.source_type === 'text'
                      ? t.project.originalText
                      : t.project.originalImages}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {signedUrl && (
                  <a
                    href={signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-sage-700 hover:text-sage-900 font-semibold px-2.5 py-1 rounded-xl bg-sage-50 border border-sage-200 shadow-2xs"
                  >
                    <span>{t.project.openInNewTab}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
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
              {tutorial.source_type === 'pdf' && signedUrl ? (
                <iframe
                  src={`${signedUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-none"
                  title="PDF Viewer Mobile"
                />
              ) : tutorial.source_type === 'text' ? (
                <div className="w-full h-full overflow-auto p-5 bg-white flex flex-col">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-yarn-100 text-xs text-yarn-600">
                    <span className="font-semibold text-yarn-800">{t.project.originalText}</span>
                    {rawTextContent && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(rawTextContent);
                          setIsCopiedText(true);
                          setTimeout(() => setIsCopiedText(false), 2000);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sage-700 hover:text-sage-900 transition-colors px-2 py-1 rounded-lg hover:bg-yarn-50"
                      >
                        {isCopiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopiedText ? 'Copié !' : 'Copier'}</span>
                      </button>
                    )}
                  </div>
                  <div className="flex-1 font-mono text-xs text-yarn-900 leading-relaxed whitespace-pre-wrap selection:bg-sage-200">
                    {rawTextContent || (
                      <div className="flex items-center justify-center h-48 text-yarn-500 gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-sage-600" />
                        <span>Chargement du texte...</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : allImageUrls.length > 0 ? (
                <ZoomableImageViewer
                  allImageUrls={allImageUrls}
                  currentImageIndex={currentImageIndex}
                  setCurrentImageIndex={setCurrentImageIndex}
                  title={tutorial.title}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-yarn-500 gap-3">
                  <FileText className="w-10 h-10 text-yarn-400 stroke-1" />
                  <p className="text-sm font-medium">Document original non disponible</p>
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

      {/* Floating Dynamic Translation Toast */}
      {translationToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short pointer-events-auto">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lift text-xs font-bold border backdrop-blur-xl ${translationToast.type === 'success'
              ? 'bg-sage-900/95 text-white border-sage-700 shadow-sage-900/30'
              : translationToast.type === 'info'
                ? 'bg-yarn-900/95 text-white border-yarn-700 shadow-yarn-900/30'
                : 'bg-red-900/95 text-white border-red-700 shadow-red-900/30'
              }`}
          >
            {translationToast.type === 'success' ? (
              <Sparkles className="w-4 h-4 text-sage-300" />
            ) : translationToast.type === 'info' ? (
              <Loader2 className="w-4 h-4 text-sage-300 animate-spin" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-300" />
            )}
            <span>{translationToast.message}</span>
          </div>
        </div>
      )}

      {/* Edit Project Details Modal / Mobile Drawer */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-yarn-950/60 backdrop-blur-md animate-backdrop-fade transition-opacity"
            onClick={() => !isSavingDetails && setIsEditModalOpen(false)}
          />

          {/* Drawer on Mobile / Modal on Desktop */}
          <div className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] bg-white rounded-t-[28px] sm:rounded-3xl border-t sm:border border-yarn-200 shadow-2xl overflow-hidden flex flex-col z-10 animate-drawer-slide-up sm:animate-modal-zoom">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-yarn-100 bg-gradient-to-br from-yarn-50 via-white to-sage-50/40 shrink-0">
              {/* Mobile Handle Bar */}
              <div className="w-10 h-1 rounded-full bg-yarn-300 mx-auto mb-3 sm:hidden shrink-0" />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-sage-100 border border-sage-200 flex items-center justify-center text-sage-800 shrink-0 shadow-2xs">
                    <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-xl font-bold font-serif text-yarn-950">
                      {t.project.editDetailsTitle}
                    </h3>
                    <p className="text-xs text-yarn-500 mt-0.5">
                      {t.project.editDetailsDesc}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => !isSavingDetails && setIsEditModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-yarn-100 hover:bg-yarn-200 text-yarn-700 hover:text-yarn-950 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <form id="edit-project-form" onSubmit={handleSaveDetails} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-yarn-900">
                    {t.project.titleLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitleInput}
                    onChange={(e) => setEditTitleInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-yarn-300 bg-white text-sm text-yarn-900 focus:outline-none focus:ring-2 focus:ring-sage-500 shadow-2xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-yarn-900">
                    {t.project.descriptionLabel}
                  </label>
                  <textarea
                    rows={4}
                    value={editNoteInput}
                    onChange={(e) => setEditNoteInput(e.target.value)}
                    placeholder={t.project.descriptionPlaceholder}
                    className="w-full p-3.5 rounded-xl border border-yarn-300 bg-white text-sm text-yarn-900 focus:outline-none focus:ring-2 focus:ring-sage-500 shadow-2xs placeholder:text-yarn-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Custom Category Dropdown */}
                  <div ref={editCategoryDropdownRef} className="space-y-1.5 relative">
                    <label className="text-xs font-bold text-yarn-900 flex items-center gap-1.5">
                      <CategoryIcon
                        category={editProjectTypeInput}
                        className={`w-3.5 h-3.5 ${editProjectTypeInput ? getCategoryStyle(editProjectTypeInput).iconColor : 'text-sage-700'}`}
                      />
                      <span>{t.project.categoryLabel || 'Catégorie'}</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEditLevelDropdown(false);
                          setShowEditCategoryDropdown((prev) => !prev);
                        }}
                        className={`w-full inline-flex items-center justify-between gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all shadow-2xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${editProjectTypeInput
                          ? `${getCategoryStyle(editProjectTypeInput).badgeClass} shadow-xs`
                          : 'bg-white text-yarn-800 hover:bg-yarn-50 border-yarn-300'
                          }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <CategoryIcon
                            category={editProjectTypeInput}
                            className={`w-3.5 h-3.5 shrink-0 ${editProjectTypeInput ? getCategoryStyle(editProjectTypeInput).iconColor : 'text-sage-700'}`}
                          />
                          <span className="truncate">
                            {!editProjectTypeInput
                              ? (t.library.filterCategoryAll || 'Non spécifié')
                              : (t.project.projectTypes as any)?.[editProjectTypeInput.toLowerCase()] || editProjectTypeInput}
                          </span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-yarn-500 shrink-0 ml-1" />
                      </button>

                      {showEditCategoryDropdown && (
                        <div className="absolute left-0 mt-1.5 w-full rounded-2xl bg-white border border-yarn-200 shadow-2xl p-1.5 z-50 animate-fadeIn">
                          <div className="space-y-0.5 max-h-56 overflow-y-auto">
                            {EDIT_CATEGORY_OPTIONS.map((opt) => {
                              const isSelected = (editProjectTypeInput || '').toLowerCase() === opt.key.toLowerCase();
                              const optStyle = getCategoryStyle(opt.key);
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => {
                                    setEditProjectTypeInput(opt.key);
                                    setShowEditCategoryDropdown(false);
                                  }}
                                  className={`w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${isSelected ? `font-bold text-yarn-950 ${optStyle.activeBg}` : 'text-yarn-800 hover:bg-yarn-50'
                                    }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <CategoryIcon
                                      category={opt.key}
                                      className={`w-3.5 h-3.5 shrink-0 ${optStyle.iconColor}`}
                                    />
                                    <span className="truncate">{opt.label}</span>
                                  </div>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-sage-700 shrink-0 ml-1.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Custom Level Dropdown */}
                  <div ref={editLevelDropdownRef} className="space-y-1.5 relative">
                    <label className="text-xs font-bold text-yarn-900 flex items-center gap-1.5">
                      <LevelIcon
                        level={editLevelInput}
                        className={`w-3.5 h-3.5 ${editLevelInput ? getLevelStyle(editLevelInput).iconColor : 'text-sage-700'}`}
                      />
                      <span>{t.project.levelLabel || 'Niveau'}</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEditCategoryDropdown(false);
                          setShowEditLevelDropdown((prev) => !prev);
                        }}
                        className={`w-full inline-flex items-center justify-between gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all shadow-2xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${editLevelInput
                          ? `${getLevelStyle(editLevelInput).badgeClass} shadow-xs`
                          : 'bg-white text-yarn-800 hover:bg-yarn-50 border-yarn-300'
                          }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <LevelIcon
                            level={editLevelInput}
                            className={`w-3.5 h-3.5 shrink-0 ${editLevelInput ? getLevelStyle(editLevelInput).iconColor : 'text-sage-700'}`}
                          />
                          <span className="truncate">
                            {!editLevelInput
                              ? (t.library.allLevels || 'Non spécifié')
                              : (t.project.levels as any)?.[editLevelInput.toLowerCase()] || editLevelInput}
                          </span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-yarn-500 shrink-0 ml-1" />
                      </button>

                      {showEditLevelDropdown && (
                        <div className="absolute left-0 mt-1.5 w-full rounded-2xl bg-white border border-yarn-200 shadow-2xl p-1.5 z-50 animate-fadeIn">
                          <div className="space-y-0.5 max-h-56 overflow-y-auto">
                            {EDIT_LEVEL_OPTIONS.map((opt) => {
                              const isSelected = (editLevelInput || '').toLowerCase() === opt.key.toLowerCase();
                              const optStyle = getLevelStyle(opt.key);
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => {
                                    setEditLevelInput(opt.key);
                                    setShowEditLevelDropdown(false);
                                  }}
                                  className={`w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${isSelected ? `font-bold text-yarn-950 ${optStyle.activeBg}` : 'text-yarn-800 hover:bg-yarn-50'
                                    }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <LevelIcon
                                      level={opt.key}
                                      className={`w-3.5 h-3.5 shrink-0 ${optStyle.iconColor}`}
                                    />
                                    <span className="truncate">{opt.label}</span>
                                  </div>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-sage-700 shrink-0 ml-1.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hook Size */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-yarn-900 flex items-center gap-1.5">
                    <Volleyball className="w-3.5 h-3.5 text-sage-700" />
                    <span>{t.project.hookLabel}</span>
                  </label>
                  <input
                    type="text"
                    value={editStitchInput}
                    onChange={(e) => setEditStitchInput(e.target.value)}
                    placeholder="Ex: 3.5 mm"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-yarn-300 bg-white text-sm text-yarn-900 focus:outline-none focus:ring-2 focus:ring-sage-500 shadow-2xs"
                  />
                </div>
              </form>
            </div>

            {/* Sticky Footer Actions */}
            <div className="p-4 sm:p-6 border-t border-yarn-100 bg-yarn-50/50 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                disabled={isSavingDetails}
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-yarn-700 hover:bg-yarn-100 border border-yarn-200 transition-colors cursor-pointer"
              >
                {t.project.cancelEdit}
              </button>
              <button
                type="submit"
                form="edit-project-form"
                disabled={isSavingDetails || !editTitleInput.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-sage-800 hover:bg-sage-900 disabled:opacity-50 transition-all shadow-soft cursor-pointer"
              >
                {isSavingDetails ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t.project.savingDetails}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.project.saveDetails}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Glossary Modal */}
      <GlossaryModal
        isOpen={showGlossaryModal}
        onClose={() => setShowGlossaryModal(false)}
      />
    </div>
  );
}
