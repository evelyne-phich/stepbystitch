'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Plus, Search, BookOpen, CheckCircle2, Sparkles, Circle, Check, ChevronDown, Layers, Tag, Loader2, Trash2, RotateCcw, Edit2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { CategoryBadge, CategoryIcon, CraftVignette, getCategoryStyle } from '@/components/ui/category-icon';
import { LevelBadge, LevelIcon, getLevelStyle } from '@/components/ui/level-icon';
import { PdfThumbnail } from '@/components/ui/pdf-thumbnail';
import {
  updateTutorialCoverImage,
  deleteTutorialCoverImage,
  resetTutorialCoverToOriginal,
  deleteTutorial,
} from '@/app/(dashboard)/library/[id]/actions';
import { Toast } from '@/components/ui/toast';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { EditProjectModal, type EditProjectModalSavedData } from '@/components/project/edit-project-modal';
import { SUPPORTED_TRANSLATION_LANGUAGES } from '@/lib/ai/translator';
import type { TutorialWithProgress } from '@/lib/types/database';

interface LibraryViewProps {
  initialTutorials: TutorialWithProgress[];
}

const normalizeSearchStr = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function LibraryView({ initialTutorials }: LibraryViewProps) {
  const { t, locale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [tutorials, setTutorials] = useState<TutorialWithProgress[]>(initialTutorials);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [uploadingCoverId, setUploadingCoverId] = useState<string | null>(null);
  const [deletingCoverId, setDeletingCoverId] = useState<string | null>(null);
  const [restoringCoverId, setRestoringCoverId] = useState<string | null>(null);
  const [confirmDeleteTutorialId, setConfirmDeleteTutorialId] = useState<string | null>(null);
  const [confirmRestoreTutorialId, setConfirmRestoreTutorialId] = useState<string | null>(null);
  const [dragOverTutorialId, setDragOverTutorialId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');
  const [filterLevel, setFilterLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Edit / Delete Project Directly from Library
  const [editingTutorial, setEditingTutorial] = useState<TutorialWithProgress | null>(null);
  const [deletingProjectTutorial, setDeletingProjectTutorial] = useState<TutorialWithProgress | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const levelDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const categoriesList = [
    { key: 'amigurumi', label: (t.project.projectTypes as any)?.amigurumi || 'Amigurumi' },
    { key: 'clothing', label: (t.project.projectTypes as any)?.clothing || 'Vêtement' },
    { key: 'accessories', label: (t.project.projectTypes as any)?.accessories || 'Accessoire' },
    { key: 'blanket', label: (t.project.projectTypes as any)?.blanket || 'Plaid & Couverture' },
    { key: 'home', label: (t.project.projectTypes as any)?.home || 'Maison & Déco' },
    { key: 'other', label: (t.project.projectTypes as any)?.other || 'Autre' },
  ] as const;

  const levelsList = [
    { key: 'beginner', label: (t.project.levels as any)?.beginner || 'Débutant' },
    { key: 'intermediate', label: (t.project.levels as any)?.intermediate || 'Intermédiaire' },
    { key: 'advanced', label: (t.project.levels as any)?.advanced || 'Avancé' },
  ] as const;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(target)) {
        setShowLevelDropdown(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(target)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setTutorials(initialTutorials);
  }, [initialTutorials]);

  const handleQuickCoverUpload = async (tutorialId: string, file: File) => {
    try {
      setUploadingCoverId(tutorialId);
      const formData = new FormData();
      formData.append('coverImage', file);
      const res = await updateTutorialCoverImage(tutorialId, formData);
      if (res.success && res.coverImageUrl) {
        setTutorials((prev) =>
          prev.map((tut) =>
            tut.id === tutorialId
              ? { ...tut, coverImageUrl: res.coverImageUrl, cover_image_path: 'updated', hasCustomCover: true }
              : tut
          )
        );
      }
    } catch (err) {
      console.error('Failed to upload cover image:', err);
    } finally {
      setUploadingCoverId(null);
    }
  };

  const handleQuickCoverDelete = async (tutorialId: string) => {
    try {
      setDeletingCoverId(tutorialId);
      const res = await deleteTutorialCoverImage(tutorialId);
      if (res.success) {
        setTutorials((prev) =>
          prev.map((tut) =>
            tut.id === tutorialId
              ? {
                ...tut,
                coverImageUrl: res.coverImageUrl,
                coverPdfUrl: res.coverPdfUrl || tut.coverPdfUrl,
                cover_image_path: null,
                hasCustomCover: false,
              }
              : tut
          )
        );
      }
    } catch (err) {
      console.error('Failed to delete cover image:', err);
    } finally {
      setDeletingCoverId(null);
    }
  };

  const handleQuickCoverRestore = async (tutorialId: string) => {
    try {
      setRestoringCoverId(tutorialId);
      const res = await resetTutorialCoverToOriginal(tutorialId);
      if (res.success) {
        setTutorials((prev) =>
          prev.map((tut) =>
            tut.id === tutorialId
              ? {
                ...tut,
                coverImageUrl: res.coverImageUrl,
                coverPdfUrl: res.coverPdfUrl,
                cover_image_path: null,
                hasCustomCover: false,
              }
              : tut
          )
        );
      }
    } catch (err) {
      console.error('Failed to restore original cover:', err);
    } finally {
      setRestoringCoverId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent, tutorialId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverTutorialId !== tutorialId) {
      setDragOverTutorialId(tutorialId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, tutorialId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverTutorialId === tutorialId) {
      setDragOverTutorialId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, tutorialId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTutorialId(null);
    const file = e.dataTransfer.files?.[0];
    if (file && ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      await handleQuickCoverUpload(tutorialId, file);
    }
  };

  const openEditModal = (tut: TutorialWithProgress) => {
    setEditingTutorial(tut);
  };

  const handleProjectModalSaved = (data: EditProjectModalSavedData) => {
    if (!editingTutorial) return;
    setTutorials((prev) =>
      prev.map((t) => {
        if (t.id !== editingTutorial.id) return t;

        let updatedTranslations = t.translations;
        if (Array.isArray(t.translations)) {
          updatedTranslations = t.translations.map((tr) => ({
            ...tr,
            content: {
              ...(typeof tr.content === 'object' && tr.content ? tr.content : {}),
              title: data.title,
              note: data.note,
            },
          }));
        }

        return {
          ...t,
          title: data.title,
          note: data.note,
          level: data.level,
          project_type: data.project_type,
          coverImageUrl: data.coverImageUrl,
          coverPdfUrl: data.coverPdfUrl !== undefined ? data.coverPdfUrl : t.coverPdfUrl,
          originalDocUrl: data.originalDocUrl !== undefined ? data.originalDocUrl : t.originalDocUrl,
          isOriginalPdf: data.isOriginalPdf !== undefined ? data.isOriginalPdf : t.isOriginalPdf,
          cover_image_path: data.cover_image_path,
          hasCustomCover: data.hasCustomCover ?? t.hasCustomCover,
          translations: updatedTranslations,
        };
      })
    );
    setToastMessage(t.project.detailsSavedToast);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConfirmDeleteProject = async () => {
    if (!deletingProjectTutorial) return;
    try {
      setIsDeletingProject(true);
      await deleteTutorial(deletingProjectTutorial.id);
      setTutorials((prev) => prev.filter((t) => t.id !== deletingProjectTutorial.id));
      setDeletingProjectTutorial(null);
      setToastMessage(t.library.projectDeletedToast);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setIsDeletingProject(false);
    }
  };

  const LEVEL_OPTIONS = [
    { key: 'all', label: t.library.filterLevelAll },
    { key: 'beginner', label: (t.project.levels as any)?.beginner || 'Débutant' },
    { key: 'intermediate', label: (t.project.levels as any)?.intermediate || 'Intermédiaire' },
    { key: 'advanced', label: (t.project.levels as any)?.advanced || 'Avancé' },
  ] as const;

  const CATEGORY_OPTIONS = [
    { key: 'all', label: t.library.filterCategoryAll || 'Toutes les catégories' },
    { key: 'amigurumi', label: (t.project.projectTypes as any)?.amigurumi || 'Amigurumi' },
    { key: 'accessory', label: (t.project.projectTypes as any)?.accessory || 'Accessoire' },
    { key: 'garment', label: (t.project.projectTypes as any)?.garment || 'Vêtement' },
    { key: 'blanket', label: (t.project.projectTypes as any)?.blanket || 'Plaid / Couverture' },
    { key: 'home', label: (t.project.projectTypes as any)?.home || 'Maison & Déco' },
    { key: 'other', label: (t.project.projectTypes as any)?.other || 'Autre' },
  ] as const;

  const matchesLevel = (tutorialLevel: string | null | undefined, filter: string) => {
    if (filter === 'all') return true;
    if (!tutorialLevel) return false;
    const norm = normalizeSearchStr(tutorialLevel);
    if (filter === 'beginner') return norm.includes('debut') || norm.includes('begin');
    if (filter === 'intermediate') return norm.includes('intermed');
    if (filter === 'advanced') return norm.includes('avanc') || norm.includes('advan');
    return true;
  };

  const matchesCategory = (tutorialType: string | null | undefined, filter: string) => {
    if (filter === 'all') return true;
    if (!tutorialType) return false;
    const norm = tutorialType.toLowerCase().trim();
    if (filter === 'garment') return norm === 'garment' || norm === 'clothing';
    if (filter === 'home') return norm === 'home' || norm === 'decoration';
    return norm === filter;
  };

  const filteredByLevelAndCategory = tutorials.filter(
    (t) => matchesLevel(t.level, filterLevel) && matchesCategory(t.project_type, filterCategory)
  );
  const notStartedCount = filteredByLevelAndCategory.filter((t) => (t.completedSteps || 0) === 0 && !t.isCompleted).length;
  const inProgressCount = filteredByLevelAndCategory.filter((t) => (t.completedSteps || 0) > 0 && !t.isCompleted).length;
  const completedCount = filteredByLevelAndCategory.filter((t) => !!t.isCompleted).length;

  const getLocalizedTutorialData = (tutorial: TutorialWithProgress) => {
    const targetLang = locale === 'en' ? 'en_us' : locale;
    const matchingTrans = tutorial.translations?.find(
      (tr) => tr.target_language === targetLang || (locale === 'en' && tr.target_language === 'en_uk')
    );
    const title = (matchingTrans?.content as any)?.title || tutorial.title;
    // Description is the crafter's universal note from tutorials table
    const note = tutorial.note ?? (matchingTrans?.content as any)?.note ?? null;

    const sourceCode = tutorial.raw_content_language || 'fr';
    const isTranslated = !!matchingTrans && matchingTrans.target_language !== sourceCode;
    const sourceLangInfo = SUPPORTED_TRANSLATION_LANGUAGES.find((l) => l.code === sourceCode) || {
      code: sourceCode as any,
      name: sourceCode.toUpperCase(),
      nativeName: sourceCode.toUpperCase(),
      flag: '🌐',
    };
    const sourceLangName = (t.project.languageNames as any)?.[sourceCode] || sourceLangInfo.nativeName;
    const translatedFromText = (t.project.translatedFromLanguage as any)?.[sourceCode] || `${t.library.translatedFrom} ${sourceLangName}`;

    return {
      title,
      note,
      isTranslated,
      sourceLangName,
      sourceLangFlag: sourceLangInfo.flag,
      translatedFromText,
    };
  };

  const matchesSearch = (tutorial: TutorialWithProgress, query: string): boolean => {
    if (!query.trim()) return true;

    const rawTokens = query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map(normalizeSearchStr);

    // Build comprehensive search corpus for this tutorial across all fields and all AI translations in DB
    const corpusParts: string[] = [
      tutorial.title || '',
      tutorial.note || '',
      tutorial.project_type || '',
      tutorial.level || '',
      (t.project?.projectTypes as any)?.[(tutorial.project_type || '').toLowerCase()] || '',
      (t.project?.levels as any)?.[(tutorial.level || '').toLowerCase()] || '',
    ];

    if (tutorial.translations && Array.isArray(tutorial.translations)) {
      tutorial.translations.forEach((tr) => {
        const content = tr.content as any;
        if (content?.title) corpusParts.push(content.title);
        if (content?.note) corpusParts.push(content.note);
        if (Array.isArray(content?.sections)) {
          corpusParts.push(...content.sections);
        }
        if (Array.isArray(content?.materials)) {
          content.materials.forEach((m: any) => {
            if (m?.name) corpusParts.push(m.name);
            if (m?.details) corpusParts.push(m.details);
          });
        }
      });
    }

    const normalizedCorpus = normalizeSearchStr(corpusParts.join(' '));

    // Every query word must match against the comprehensive tutorial corpus
    return rawTokens.every((token) => normalizedCorpus.includes(token));
  };

  const filteredTutorials = initialTutorials.filter((tutorial) => {
    if (!matchesSearch(tutorial, searchQuery)) return false;

    if (!matchesLevel(tutorial.level, filterLevel)) return false;
    if (!matchesCategory(tutorial.project_type, filterCategory)) return false;

    if (filterStatus === 'not_started') {
      return (tutorial.completedSteps || 0) === 0 && !tutorial.isCompleted;
    }
    if (filterStatus === 'in_progress') {
      return (tutorial.completedSteps || 0) > 0 && !tutorial.isCompleted;
    }
    if (filterStatus === 'completed') {
      return !!tutorial.isCompleted;
    }
    return true;
  });

  return (
    <div className="space-y-8">

      {/* Header section */}
      <div className="pb-6 border-b border-yarn-200">
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-yarn-900 tracking-tight">
          {t.library.title}
        </h1>
        <p className="text-sm text-yarn-700 mt-1">
          {t.library.subtitle}
        </p>
      </div>

      {/* Filter and search bar */}
      <div className="space-y-3">
        {/* Search & Dropdown Filters Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search input */}
          <div className="relative flex-1 min-w-0">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-yarn-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.library.searchPlaceholder}
              className="w-full pl-10 pr-4 h-10 rounded-2xl border border-yarn-200 bg-white text-sm text-yarn-900 placeholder:text-yarn-400 focus:outline-none focus:ring-2 focus:ring-sage-500 shadow-soft"
            />
          </div>

          {/* Dropdown Filters (Level + Category - 50/50 side-by-side on mobile, inline on desktop) */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto shrink-0">
            {/* Custom Level Filter Dropdown */}
            <div ref={levelDropdownRef} className="relative min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowCategoryDropdown(false);
                  setShowLevelDropdown((prev) => !prev);
                }}
                className={`w-full sm:w-auto h-10 inline-flex items-center justify-between sm:justify-start gap-1.5 px-3 sm:px-3.5 rounded-2xl text-xs font-bold border transition-all shadow-2xs sm:hover:scale-105 active:scale-95 cursor-pointer ${filterLevel !== 'all'
                  ? `${getLevelStyle(filterLevel).badgeClass} shadow-xs`
                  : 'bg-white text-yarn-800 hover:bg-yarn-100 border-yarn-300'
                  }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <LevelIcon
                    level={filterLevel !== 'all' ? filterLevel : null}
                    className={`w-3.5 h-3.5 shrink-0 ${filterLevel !== 'all' ? getLevelStyle(filterLevel).iconColor : 'text-sage-700'}`}
                  />
                  <span className="truncate">
                    {filterLevel === 'all'
                      ? t.library.filterLevelAll
                      : (t.project.levels as any)?.[filterLevel] || filterLevel}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-yarn-500 shrink-0 ml-1" />
              </button>

              {showLevelDropdown && (
                <div className="absolute left-0 mt-2 w-48 max-w-[85vw] sm:w-48 rounded-2xl bg-white border border-yarn-200 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-yarn-400 uppercase tracking-wider">
                    {t.project.levelLabel || 'Niveau'}
                  </div>
                  <div className="space-y-0.5 max-h-64 overflow-y-auto">
                    {LEVEL_OPTIONS.map((opt) => {
                      const isSelected = filterLevel === opt.key;
                      const optStyle = getLevelStyle(opt.key !== 'all' ? opt.key : null);
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setFilterLevel(opt.key as any);
                            setShowLevelDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${isSelected ? `font-bold text-yarn-950 ${optStyle.activeBg}` : 'text-yarn-800 hover:bg-yarn-50'
                            }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <LevelIcon
                              level={opt.key !== 'all' ? opt.key : null}
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

            {/* Custom Category / Project Type Filter Dropdown */}
            <div ref={categoryDropdownRef} className="relative min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowLevelDropdown(false);
                  setShowCategoryDropdown((prev) => !prev);
                }}
                className={`w-full sm:w-auto h-10 inline-flex items-center justify-between sm:justify-start gap-1.5 px-3 sm:px-3.5 rounded-2xl text-xs font-bold border transition-all shadow-2xs sm:hover:scale-105 active:scale-95 cursor-pointer ${filterCategory !== 'all'
                  ? `${getCategoryStyle(filterCategory).badgeClass} shadow-xs`
                  : 'bg-white text-yarn-800 hover:bg-yarn-100 border-yarn-300'
                  }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <CategoryIcon
                    category={filterCategory !== 'all' ? filterCategory : null}
                    className={`w-3.5 h-3.5 shrink-0 ${filterCategory !== 'all' ? getCategoryStyle(filterCategory).iconColor : 'text-sage-700'}`}
                  />
                  <span className="truncate">
                    {filterCategory === 'all'
                      ? t.library.filterCategoryAll || 'Toutes les catégories'
                      : (t.project.projectTypes as any)?.[filterCategory] || filterCategory}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-yarn-500 shrink-0 ml-1" />
              </button>

              {showCategoryDropdown && (
                <div className="absolute right-0 sm:left-auto sm:right-0 mt-2 w-52 max-w-[85vw] sm:w-52 rounded-2xl bg-white border border-yarn-200 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-yarn-400 uppercase tracking-wider">
                    {t.library.filterCategoryLabel || 'Catégorie'}
                  </div>
                  <div className="space-y-0.5 max-h-64 overflow-y-auto">
                    {CATEGORY_OPTIONS.map((opt) => {
                      const isSelected = filterCategory === opt.key;
                      const optStyle = getCategoryStyle(opt.key !== 'all' ? opt.key : null);
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setFilterCategory(opt.key);
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${isSelected ? `font-bold text-yarn-950 ${optStyle.activeBg}` : 'text-yarn-800 hover:bg-yarn-50'
                            }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <CategoryIcon
                              category={opt.key !== 'all' ? opt.key : null}
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

        {/* Status Tabs: 100% visible on all screens (2x2 grid on mobile, inline on tablet & desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs text-center flex items-center justify-center gap-1.5 cursor-pointer ${filterStatus === 'all'
              ? 'bg-yarn-900 text-white shadow-soft'
              : 'bg-white text-yarn-700 border border-yarn-200 hover:bg-yarn-50 hover:border-yarn-300'
              }`}
          >
            <span>{t.library.filterAll}</span>
            <span className={`text-[10px] min-w-[20px] h-5 px-1.5 rounded-full font-mono font-bold inline-flex items-center justify-center shrink-0 ${filterStatus === 'all' ? 'bg-white/20 text-white' : 'bg-yarn-100 text-yarn-700'
              }`}>
              {filteredByLevelAndCategory.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('not_started')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shadow-2xs text-center flex items-center justify-center gap-1.5 cursor-pointer ${filterStatus === 'not_started'
              ? 'bg-rose-800 text-white border-rose-800 shadow-soft'
              : 'bg-white text-rose-800 border border-rose-200/80 hover:bg-rose-50'
              }`}
          >
            <Circle className={`w-2 h-2 shrink-0 ${filterStatus === 'not_started' ? 'fill-white text-white' : 'text-rose-500 fill-rose-500/30'}`} />
            <span className="truncate">
              {notStartedCount <= 1
                ? (t.library.filterNotStartedSingular || 'Non commencé')
                : (t.library.filterNotStartedPlural || 'Non commencés')}
            </span>
            <span className={`text-[10px] min-w-[20px] h-5 px-1.5 rounded-full font-mono font-bold inline-flex items-center justify-center shrink-0 ${filterStatus === 'not_started' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
              }`}>
              {notStartedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('in_progress')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shadow-2xs text-center flex items-center justify-center gap-1.5 cursor-pointer ${filterStatus === 'in_progress'
              ? 'bg-orange-500 text-white border-orange-500 shadow-soft'
              : 'bg-white text-orange-600 border border-orange-200 hover:bg-orange-50'
              }`}
          >
            <Sparkles className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{t.library.filterInProgress}</span>
            <span className={`text-[10px] min-w-[20px] h-5 px-1.5 rounded-full font-mono font-bold inline-flex items-center justify-center shrink-0 ${filterStatus === 'in_progress' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
              }`}>
              {inProgressCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('completed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shadow-2xs text-center flex items-center justify-center gap-1.5 cursor-pointer ${filterStatus === 'completed'
              ? 'bg-emerald-800 text-white border-emerald-800 shadow-soft'
              : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
              }`}
          >
            <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">
              {completedCount <= 1
                ? (t.library.filterCompletedSingular || 'Terminé')
                : (t.library.filterCompletedPlural || 'Terminés')}
            </span>
            <span className={`text-[10px] min-w-[20px] h-5 px-1.5 rounded-full font-mono font-bold inline-flex items-center justify-center shrink-0 ${filterStatus === 'completed' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
              {completedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Tutorials Grid or Empty State */}
      {filteredTutorials.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-dashed border-yarn-300 text-center space-y-6 max-w-2xl mx-auto my-12">
          <div className="w-16 h-16 rounded-3xl bg-yarn-100 text-yarn-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold font-serif text-yarn-900">
              {t.library.emptyTitle}
            </h2>
            <p className="text-sm text-yarn-600 leading-relaxed">
              {t.library.emptyDesc}
            </p>
          </div>

          <Link
            href="/library/new"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-sage-800 hover:bg-sage-900 shadow-soft hover:shadow-md transition-all duration-300 ease-out cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.library.importFirst}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutorials.map((tutorial) => {
            const isCompleted = tutorial.isCompleted;
            const progress = tutorial.progressPercent || 0;
            const isNotStarted = (tutorial.completedSteps || 0) === 0 && !isCompleted;
            const { title: displayTitle, note: displayNote, isTranslated, sourceLangName, sourceLangFlag } = getLocalizedTutorialData(tutorial);

            return (
              <Link
                key={tutorial.id}
                href={`/library/${tutorial.id}`}
                className={`group bg-white rounded-3xl p-4 sm:p-5 border shadow-soft hover:shadow-lift transition-all flex flex-col justify-between h-full ${isCompleted
                  ? 'border-emerald-200/90 hover:border-emerald-400 ring-1 ring-emerald-500/10'
                  : isNotStarted
                    ? 'border-yarn-200 hover:border-rose-300'
                    : 'border-yarn-200 hover:border-orange-300'
                  }`}
              >
                {/* Top Content Area */}
                <div className="flex-1 flex flex-col space-y-2.5">
                  {/* Top Row above Image: Status Badge on Left + Saved Date on Right */}
                  <div className="flex items-center justify-between gap-2 shrink-0">
                    <div>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/90 shadow-2xs animate-in fade-in">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{t.library.statusCompleted}</span>
                        </span>
                      ) : isNotStarted ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-rose-800 bg-rose-50 border border-rose-200/80 shadow-2xs">
                          <Circle className="w-2.5 h-2.5 text-rose-500 fill-rose-500/20" />
                          <span>{t.library.statusNotStarted}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 shadow-2xs">
                          <Sparkles className="w-3 h-3 text-orange-500 animate-pulse" />
                          <span>{t.library.statusInProgress}</span>
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-yarn-400 font-mono font-medium shrink-0">
                      {new Date(tutorial.saved_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                    </span>
                  </div>

                  {/* Visual Pattern Preview Banner (Clean & Unobstructed) */}
                  <div
                    className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden bg-yarn-100/70 border border-yarn-200/80 shadow-2xs group-hover:border-yarn-300 transition-all flex items-center justify-center shrink-0"
                  >
                    {tutorial.coverImageUrl ? (
                      <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-yarn-900/10">
                        <img
                          src={tutorial.coverImageUrl}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-110 opacity-55 pointer-events-none"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                        <img
                          src={tutorial.coverImageUrl}
                          alt={displayTitle}
                          className="relative z-10 w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    ) : tutorial.coverPdfUrl ? (
                      <div className="relative w-full h-full">
                        <PdfThumbnail
                          pdfUrl={tutorial.coverPdfUrl}
                          alt={displayTitle}
                          className="group-hover:scale-105 transition-transform duration-500"
                          fallback={
                            <CraftVignette
                              category={tutorial.project_type}
                              title={displayTitle}
                            />
                          }
                        />
                      </div>
                    ) : (
                      /* Rich Artisanal Craft Vignette with Category Theme */
                      <CraftVignette
                        category={tutorial.project_type}
                        title={displayTitle}
                      />
                    )}
                  </div>

                  {/* Metadata Row: Category Badge & Translated From badge on left + Edit & Delete Buttons on right */}
                  <div className="flex items-center justify-between gap-2 pt-0.5 shrink-0">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      {tutorial.project_type && (
                        <CategoryBadge
                          category={tutorial.project_type}
                          label={(t.project.projectTypes as any)?.[tutorial.project_type.toLowerCase()] || tutorial.project_type}
                        />
                      )}
                      {sourceLangName && (
                        <span
                          title={`${t.library.originalLanguageBadge} ${sourceLangFlag} ${sourceLangName}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-yarn-600 bg-yarn-100/90 border border-yarn-200 shadow-2xs shrink-0"
                        >
                          <span className="text-yarn-500 font-medium">{t.library.originalLanguageBadge}</span>
                          <span className="text-[11px] leading-none">{sourceLangFlag}</span>
                          <span className="truncate max-w-[130px] font-bold text-yarn-700">{sourceLangName}</span>
                        </span>
                      )}
                    </div>

                    {/* Quick Edit ✏️ & Delete 🗑️ Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        title={t.library.editProject}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openEditModal(tutorial);
                        }}
                        className="h-7 w-7 rounded-lg bg-yarn-50 hover:bg-yarn-100 text-yarn-600 hover:text-yarn-900 border border-yarn-200/80 shadow-2xs flex items-center justify-center cursor-pointer transition-all sm:hover:scale-105 active:scale-95"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        title={t.library.deleteProject}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeletingProjectTutorial(tutorial);
                        }}
                        className="h-7 w-7 rounded-lg bg-yarn-50 hover:bg-rose-50 text-yarn-600 hover:text-rose-600 border border-yarn-200/80 hover:border-rose-200 shadow-2xs flex items-center justify-center cursor-pointer transition-all sm:hover:scale-105 active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Note (expands to keep cards aligned) */}
                  <div className="space-y-1.5 flex-1">
                    <h2 className="text-base sm:text-lg font-bold font-serif text-yarn-900 group-hover:text-yarn-700 transition-colors line-clamp-2">
                      {displayTitle}
                    </h2>

                    {displayNote && (
                      <p className="text-xs text-yarn-600 line-clamp-2 leading-relaxed">
                        {displayNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Pinned Block: Progress Bar + Level & Open Action */}
                <div className="mt-4 pt-3.5 border-t border-yarn-100 space-y-3 shrink-0">
                  {/* Interactive Progress Track */}
                  {tutorial.totalSteps !== undefined && tutorial.totalSteps > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-medium text-yarn-500">
                        <span>
                          {tutorial.completedSteps || 0} / {tutorial.totalSteps} {t.library.stepsCompletedLabel}
                        </span>
                        <span
                          className={`font-bold font-mono ${isCompleted
                            ? 'text-emerald-700'
                            : isNotStarted
                              ? 'text-rose-600'
                              : 'text-orange-500'
                            }`}
                        >
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-yarn-100 overflow-hidden border border-yarn-200/50 p-px">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${isCompleted
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-400'
                            : isNotStarted
                              ? 'bg-rose-300'
                              : 'bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400'
                            }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Level & Open Action */}
                  <div className="flex items-center justify-between text-xs text-yarn-500">
                    {tutorial.level ? (
                      <LevelBadge
                        level={tutorial.level}
                        label={(t.project.levels as any)?.[tutorial.level.toLowerCase()] || tutorial.level}
                      />
                    ) : (
                      <span className="text-yarn-400 text-[11px] font-medium">
                        {t.library.allLevels}
                      </span>
                    )}
                    <span className={`font-semibold transition-transform group-hover:translate-x-1 inline-flex items-center gap-1 ${isCompleted
                      ? 'text-emerald-700'
                      : isNotStarted
                        ? 'text-rose-700'
                        : 'text-orange-600'
                      }`}>
                      {t.library.openPattern}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pretty Satin Confirmation Modal for Deleting Cover Image */}
      {confirmDeleteTutorialId && (
        <div
          className="fixed inset-0 z-50 bg-yarn-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDeleteTutorialId(null);
          }}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full border border-yarn-200 shadow-lift flex flex-col items-center text-center gap-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shadow-2xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-yarn-900 font-serif">
                {t.library.confirmDeleteCoverTitle}
              </h3>
            </div>
            <div className="flex items-center gap-2.5 w-full mt-1">
              <button
                type="button"
                disabled={deletingCoverId !== null}
                onClick={() => setConfirmDeleteTutorialId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-yarn-200 hover:bg-yarn-50 text-yarn-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.library.confirmDeleteCoverCancel}
              </button>
              <button
                type="button"
                disabled={deletingCoverId !== null}
                onClick={async () => {
                  const id = confirmDeleteTutorialId;
                  if (id) {
                    await handleQuickCoverDelete(id);
                  }
                  setConfirmDeleteTutorialId(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-soft transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {deletingCoverId === confirmDeleteTutorialId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t.library.deletingCover}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.library.confirmDeleteCoverConfirm}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pretty Satin Confirmation Modal for Restoring Original Cover Image */}
      {confirmRestoreTutorialId && (
        <div
          className="fixed inset-0 z-50 bg-yarn-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmRestoreTutorialId(null);
          }}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full border border-yarn-200 shadow-lift flex flex-col items-center text-center gap-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-sage-50 text-sage-700 border border-sage-200 flex items-center justify-center shadow-2xs">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-yarn-900 font-serif">
                {t.library.confirmRestoreCoverTitle}
              </h3>
            </div>
            <div className="flex items-center gap-2.5 w-full mt-1">
              <button
                type="button"
                disabled={restoringCoverId !== null}
                onClick={() => setConfirmRestoreTutorialId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-yarn-200 hover:bg-yarn-50 text-yarn-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.library.confirmRestoreCoverCancel}
              </button>
              <button
                type="button"
                disabled={restoringCoverId !== null}
                onClick={async () => {
                  const id = confirmRestoreTutorialId;
                  if (id) {
                    await handleQuickCoverRestore(id);
                  }
                  setConfirmRestoreTutorialId(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-sage-700 hover:bg-sage-800 text-white text-xs font-bold shadow-soft transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {restoringCoverId === confirmRestoreTutorialId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t.library.restoringCover}</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.library.confirmRestoreCoverConfirm}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {deletingProjectTutorial && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-yarn-950/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setDeletingProjectTutorial(null);
          }}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full border border-yarn-200 shadow-lift flex flex-col items-center text-center gap-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shadow-2xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-yarn-900 font-serif">
                {t.library.confirmDeleteProjectTitle}
              </h3>
              <p className="text-xs text-yarn-600 leading-relaxed">
                {t.library.confirmDeleteProjectDesc}
              </p>
            </div>
            <div className="flex items-center gap-2.5 w-full mt-1">
              <button
                type="button"
                disabled={isDeletingProject}
                onClick={() => setDeletingProjectTutorial(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-yarn-200 hover:bg-yarn-50 text-yarn-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.library.confirmDeleteProjectCancel}
              </button>
              <button
                type="button"
                disabled={isDeletingProject}
                onClick={handleConfirmDeleteProject}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-soft transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isDeletingProject ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t.project.deleting}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.library.confirmDeleteProjectConfirm}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Shared Unified Edit Project Details Modal */}
      {editingTutorial && (() => {
        const targetLang = locale === 'en' ? 'en_us' : locale;
        const matchingTrans = editingTutorial.translations?.find(
          (tr) => tr.target_language === targetLang || (locale === 'en' && tr.target_language === 'en_uk')
        );
        const activeTargetLang = matchingTrans ? matchingTrans.target_language : 'original';
        const activeTitle = (matchingTrans?.content as any)?.title || editingTutorial.title;

        return (
          <EditProjectModal
            isOpen={Boolean(editingTutorial)}
            onClose={() => setEditingTutorial(null)}
            tutorialId={editingTutorial.id}
            initialTitle={activeTitle}
            initialNote={editingTutorial.note || null}
            initialLevel={editingTutorial.level || null}
            initialProjectType={editingTutorial.project_type || null}
            initialCoverImageUrl={editingTutorial.coverImageUrl || null}
            hasCustomCover={editingTutorial.hasCustomCover}
            hasOriginalDoc={editingTutorial.hasOriginalDoc}
            coverPdfUrl={editingTutorial.coverPdfUrl || null}
            originalDocUrl={editingTutorial.originalDocUrl || null}
            isOriginalPdf={editingTutorial.isOriginalPdf || false}
            targetLanguage={activeTargetLang}
            sourceLanguage={editingTutorial.raw_content_language || 'fr'}
            onSaved={handleProjectModalSaved}
          />
        );
      })()}

      {/* Standardized Bottom-Right Toast Notification */}
      <Toast
        message={toastMessage}
        type="success"
        onClose={() => setToastMessage(null)}
      />

      {/* Floating Scroll To Top Button */}
      <ScrollToTop threshold={350} />
    </div>
  );
}
