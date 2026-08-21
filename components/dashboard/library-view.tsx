'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, BookOpen, CheckCircle2, Sparkles, Circle, Check, ChevronDown, Layers, Tag } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { CategoryBadge, CategoryIcon, getCategoryStyle } from '@/components/ui/category-icon';
import type { TutorialWithProgress } from '@/lib/types/database';

interface LibraryViewProps {
  initialTutorials: TutorialWithProgress[];
}

const normalizeSearchStr = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function LibraryView({ initialTutorials }: LibraryViewProps) {
  const { t, locale } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');
  const [filterLevel, setFilterLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

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

  const filteredByLevelAndCategory = initialTutorials.filter(
    (t) => matchesLevel(t.level, filterLevel) && matchesCategory(t.project_type, filterCategory)
  );
  const notStartedCount = filteredByLevelAndCategory.filter((t) => (t.completedSteps || 0) === 0 && !t.isCompleted).length;
  const inProgressCount = filteredByLevelAndCategory.filter((t) => (t.completedSteps || 0) > 0 && !t.isCompleted).length;
  const completedCount = filteredByLevelAndCategory.filter((t) => !!t.isCompleted).length;

  const getLocalizedTutorialData = (tutorial: TutorialWithProgress) => {
    const targetLang = locale === 'fr' ? 'fr' : 'en_us';
    const matchingTrans = tutorial.translations?.find(
      (tr) => tr.target_language === targetLang || (locale === 'en' && tr.target_language === 'en_uk')
    );
    const title = (matchingTrans?.content as any)?.title || tutorial.title;
    const note = (matchingTrans?.content as any)?.note || tutorial.note;
    return { title, note };
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-yarn-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-yarn-900 tracking-tight">
            {t.library.title}
          </h1>
          <p className="text-sm text-yarn-700 mt-1">
            {t.library.subtitle}
          </p>
        </div>

        <Link
          href="/library/new"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-sage-800 via-sage-700 to-sage-600 hover:from-sage-900 hover:to-sage-700 shadow-soft hover:shadow-lift transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t.library.importButton}</span>
        </Link>
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
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-yarn-200 bg-white text-sm text-yarn-900 placeholder:text-yarn-400 focus:outline-none focus:ring-2 focus:ring-sage-500 shadow-soft"
            />
          </div>

          {/* Dropdown Filters (Level + Category) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Custom Level Filter Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCategoryDropdown(false);
                  setShowLevelDropdown((prev) => !prev);
                }}
                className={`w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer ${
                  filterLevel !== 'all'
                    ? 'bg-sage-100 text-sage-900 border-sage-300 shadow-xs'
                    : 'bg-white text-yarn-800 hover:bg-yarn-100 border-yarn-300'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Layers className="w-3.5 h-3.5 text-sage-700 shrink-0" />
                  <span className="truncate">
                    {filterLevel === 'all'
                      ? t.library.filterLevelAll
                      : (t.project.levels as any)?.[filterLevel] || filterLevel}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-yarn-500 shrink-0 ml-1" />
              </button>

              {showLevelDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setShowLevelDropdown(false)}
                  />
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 mt-2 w-full sm:w-48 rounded-2xl bg-white border border-yarn-200 shadow-2xl p-1.5 z-50 animate-fadeIn"
                  >
                    <div className="px-2.5 py-1 text-[10px] font-bold text-yarn-400 uppercase tracking-wider">
                      {t.project.levelLabel || 'Niveau'}
                    </div>
                    <div className="space-y-0.5 max-h-64 overflow-y-auto">
                      {LEVEL_OPTIONS.map((opt) => {
                        const isSelected = filterLevel === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => {
                              setFilterLevel(opt.key as any);
                              setShowLevelDropdown(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected ? 'font-bold text-sage-900 bg-sage-50' : 'text-yarn-800 hover:bg-yarn-50'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-sage-700 shrink-0 ml-1.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Custom Category / Project Type Filter Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLevelDropdown(false);
                  setShowCategoryDropdown((prev) => !prev);
                }}
                className={`w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer ${
                  filterCategory !== 'all'
                    ? `${getCategoryStyle(filterCategory).badgeClass} shadow-xs`
                    : 'bg-white text-yarn-800 hover:bg-yarn-100 border-yarn-300'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
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
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setShowCategoryDropdown(false)}
                  />
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-52 rounded-2xl bg-white border border-yarn-200 shadow-2xl p-1.5 z-50 animate-fadeIn"
                  >
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
                            className={`w-full text-left px-2.5 py-1.5 text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected ? `font-bold text-yarn-950 ${optStyle.activeBg}` : 'text-yarn-800 hover:bg-yarn-50'
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
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Tabs: 100% visible on all screens (2x2 grid on mobile, inline on tablet & desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-yarn-900 text-white shadow-soft'
                : 'bg-white text-yarn-700 border border-yarn-200 hover:bg-yarn-50 hover:border-yarn-300'
            }`}
          >
            <span>{t.library.filterAll}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              filterStatus === 'all' ? 'bg-white/20 text-white' : 'bg-yarn-100 text-yarn-700'
            }`}>
              {filteredByLevelAndCategory.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('not_started')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shadow-2xs text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              filterStatus === 'not_started'
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
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              filterStatus === 'not_started' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
            }`}>
              {notStartedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('in_progress')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shadow-2xs text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              filterStatus === 'in_progress'
                ? 'bg-orange-500 text-white border-orange-500 shadow-soft'
                : 'bg-white text-orange-600 border border-orange-200 hover:bg-orange-50'
            }`}
          >
            <Sparkles className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{t.library.filterInProgress}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              filterStatus === 'in_progress' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
            }`}>
              {inProgressCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('completed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shadow-2xs text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              filterStatus === 'completed'
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
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              filterStatus === 'completed' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
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
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-sage-800 to-sage-600 hover:from-sage-900 hover:to-sage-700 shadow-lift transition-transform transform hover:-translate-y-0.5"
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

            return (
              <Link
                key={tutorial.id}
                href={`/library/${tutorial.id}`}
                className={`group bg-white rounded-3xl p-6 border shadow-soft hover:shadow-lift transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'border-emerald-200/90 hover:border-emerald-400 ring-1 ring-emerald-500/10'
                    : isNotStarted
                    ? 'border-yarn-200 hover:border-rose-300'
                    : 'border-yarn-200 hover:border-orange-300'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header Badges: Category & Progression Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Category / Project Type Badge */}
                      {tutorial.project_type && (
                        <CategoryBadge
                          category={tutorial.project_type}
                          label={(t.project.projectTypes as any)?.[tutorial.project_type.toLowerCase()] || tutorial.project_type}
                        />
                      )}

                      {/* Status Badges: Red / Orange / Green Color Coding */}
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/90 shadow-2xs animate-in fade-in">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{t.library.statusCompleted}</span>
                        </span>
                      ) : isNotStarted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-rose-800 bg-rose-50 border border-rose-200/80 shadow-2xs">
                          <Circle className="w-2.5 h-2.5 text-rose-500 fill-rose-500/20" />
                          <span>{t.library.statusNotStarted}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 shadow-2xs">
                          <Sparkles className="w-3 h-3 text-orange-500 animate-pulse" />
                          <span>{t.library.statusInProgress}</span>
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-yarn-400 font-mono shrink-0 pt-0.5">
                      {new Date(tutorial.saved_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                    </span>
                  </div>

                  {/* Title & Note */}
                  {(() => {
                    const { title: displayTitle, note: displayNote } = getLocalizedTutorialData(tutorial);
                    return (
                      <div className="space-y-1.5">
                        <h2 className="text-lg font-bold font-serif text-yarn-900 group-hover:text-yarn-700 transition-colors line-clamp-2">
                          {displayTitle}
                        </h2>

                        {displayNote && (
                          <p className="text-xs text-yarn-600 line-clamp-2 leading-relaxed">
                            {displayNote}
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Interactive Progress Track */}
                  {tutorial.totalSteps !== undefined && tutorial.totalSteps > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-medium text-yarn-500">
                        <span>
                          {tutorial.completedSteps || 0} / {tutorial.totalSteps} {t.library.stepsCompletedLabel}
                        </span>
                        <span
                          className={`font-bold font-mono ${
                            isCompleted
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
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCompleted
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
                </div>

                <div className="pt-4 mt-4 border-t border-yarn-100 flex items-center justify-between text-xs text-yarn-500">
                  <span className="capitalize font-medium">
                    {tutorial.level ? ((t.project.levels as any)?.[tutorial.level.toLowerCase()] || tutorial.level) : t.library.allLevels}
                  </span>
                  <span className={`font-semibold transition-transform group-hover:translate-x-1 inline-flex items-center gap-1 ${
                    isCompleted
                      ? 'text-emerald-700'
                      : isNotStarted
                      ? 'text-rose-700'
                      : 'text-orange-600'
                  }`}>
                    {t.library.openPattern}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
