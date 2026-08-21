'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, BookOpen, FileText, Image as ImageIcon, AlignLeft, CheckCircle2, Sparkles, Circle, Check, ChevronDown, Layers } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import type { TutorialWithProgress } from '@/lib/types/database';

interface LibraryViewProps {
  initialTutorials: TutorialWithProgress[];
}

export function LibraryView({ initialTutorials }: LibraryViewProps) {
  const { t, locale } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');
  const [filterLevel, setFilterLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);

  const LEVEL_OPTIONS = [
    { key: 'all', label: t.library.filterLevelAll },
    { key: 'beginner', label: (t.project.levels as any)?.beginner || 'Débutant' },
    { key: 'intermediate', label: (t.project.levels as any)?.intermediate || 'Intermédiaire' },
    { key: 'advanced', label: (t.project.levels as any)?.advanced || 'Avancé' },
  ] as const;

  const matchesLevel = (tutorialLevel: string | null | undefined, filter: string) => {
    if (filter === 'all') return true;
    if (!tutorialLevel) return false;
    const norm = tutorialLevel.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (filter === 'beginner') return norm.includes('debut') || norm.includes('begin');
    if (filter === 'intermediate') return norm.includes('intermed');
    if (filter === 'advanced') return norm.includes('avanc') || norm.includes('advan');
    return true;
  };

  const levelFilteredTutorials = initialTutorials.filter((t) => matchesLevel(t.level, filterLevel));
  const notStartedCount = levelFilteredTutorials.filter((t) => (t.completedSteps || 0) === 0 && !t.isCompleted).length;
  const inProgressCount = levelFilteredTutorials.filter((t) => (t.completedSteps || 0) > 0 && !t.isCompleted).length;
  const completedCount = levelFilteredTutorials.filter((t) => !!t.isCompleted).length;

  const getLocalizedTutorialData = (tutorial: TutorialWithProgress) => {
    const targetLang = locale === 'fr' ? 'fr' : 'en_us';
    const matchingTrans = tutorial.translations?.find(
      (tr) => tr.target_language === targetLang || (locale === 'en' && tr.target_language === 'en_uk')
    );
    const title = (matchingTrans?.content as any)?.title || tutorial.title;
    const note = (matchingTrans?.content as any)?.note || tutorial.note;
    return { title, note };
  };

  const filteredTutorials = initialTutorials.filter((tutorial) => {
    const { title, note } = getLocalizedTutorialData(tutorial);
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note && note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tutorial.note && tutorial.note.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (!matchesLevel(tutorial.level, filterLevel)) return false;

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
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
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

        {/* Filter controls row */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Custom Level Filter Dropdown (Stand-alone relative container, not clipped by overflow) */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowLevelDropdown((prev) => !prev);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer ${
                filterLevel !== 'all'
                  ? 'bg-sage-100 text-sage-900 border-sage-300 shadow-xs'
                  : 'bg-white text-yarn-800 hover:bg-yarn-100 border-yarn-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sage-700" />
              <span>
                {filterLevel === 'all'
                  ? t.library.filterLevelAll
                  : (t.project.levels as any)?.[filterLevel] || filterLevel}
              </span>
              <ChevronDown className="w-3 h-3 text-yarn-500" />
            </button>

            {showLevelDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setShowLevelDropdown(false)}
                />
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 mt-2 w-48 rounded-2xl bg-white border border-yarn-200 shadow-2xl p-1.5 z-50 animate-fadeIn"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-yarn-400 uppercase tracking-wider">
                    {t.project.levelLabel || 'Niveau'}
                  </div>
                  <div className="space-y-0.5">
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

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold shadow-soft transition-colors shrink-0 ${
                filterStatus === 'all'
                  ? 'bg-yarn-900 text-white'
                  : 'bg-white text-yarn-700 border border-yarn-200 hover:bg-yarn-100'
              }`}
            >
              {t.library.filterAll} ({levelFilteredTutorials.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('not_started')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                filterStatus === 'not_started'
                  ? 'bg-rose-800 text-white border-rose-800 shadow-2xs'
                  : 'bg-white text-rose-800 border border-rose-200/80 hover:bg-rose-50'
              }`}
            >
              {notStartedCount <= 1
                ? (t.library.filterNotStartedSingular || 'Non commencé')
                : (t.library.filterNotStartedPlural || 'Non commencés')}{' '}
              ({notStartedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('in_progress')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                filterStatus === 'in_progress'
                  ? 'bg-orange-500 text-white border-orange-500 shadow-2xs'
                  : 'bg-white text-orange-600 border border-orange-200 hover:bg-orange-50'
              }`}
            >
              {t.library.filterInProgress} ({inProgressCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                filterStatus === 'completed'
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                  : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              {completedCount <= 1
                ? (t.library.filterCompletedSingular || 'Terminé')
                : (t.library.filterCompletedPlural || 'Terminés')}{' '}
              ({completedCount})
            </button>
          </div>
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
                  {/* Card Header Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase bg-yarn-100 text-yarn-700">
                        {tutorial.source_type === 'pdf' && <FileText className="w-3 h-3 text-sage-600" />}
                        {tutorial.source_type === 'image' && <ImageIcon className="w-3 h-3 text-sage-600" />}
                        {tutorial.source_type === 'text' && <AlignLeft className="w-3 h-3 text-sage-600" />}
                        <span>{((t.library.sourceTypes as any)?.[tutorial.source_type] || tutorial.source_type).toUpperCase()}</span>
                      </span>

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

                    <span className="text-[11px] text-yarn-400 font-mono shrink-0">
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
