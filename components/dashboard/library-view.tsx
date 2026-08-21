'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, BookOpen, FileText, Image as ImageIcon, AlignLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import type { TutorialWithProgress } from '@/lib/types/database';

interface LibraryViewProps {
  initialTutorials: TutorialWithProgress[];
}

export function LibraryView({ initialTutorials }: LibraryViewProps) {
  const { t, locale } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'completed'>('all');

  const inProgressCount = initialTutorials.filter((t) => !t.isCompleted).length;
  const completedCount = initialTutorials.filter((t) => !!t.isCompleted).length;

  const filteredTutorials = initialTutorials.filter((tutorial) => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tutorial.note && tutorial.note.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (filterStatus === 'in_progress') {
      return !tutorial.isCompleted;
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-soft transition-colors ${
              filterStatus === 'all'
                ? 'bg-yarn-900 text-white'
                : 'bg-white text-yarn-700 border border-yarn-200 hover:bg-yarn-100'
            }`}
          >
            {t.library.filterAll} ({initialTutorials.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('in_progress')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
              filterStatus === 'in_progress'
                ? 'bg-yarn-900 text-white border-yarn-900'
                : 'bg-white text-yarn-700 border border-yarn-200 hover:bg-yarn-100'
            }`}
          >
            {t.library.filterInProgress} ({inProgressCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
              filterStatus === 'completed'
                ? 'bg-emerald-800 text-white border-emerald-800'
                : 'bg-white text-yarn-700 border border-yarn-200 hover:bg-yarn-100'
            }`}
          >
            {t.library.filterCompleted} ({completedCount})
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

            return (
              <Link
                key={tutorial.id}
                href={`/library/${tutorial.id}`}
                className={`group bg-white rounded-3xl p-6 border shadow-soft hover:shadow-lift transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'border-emerald-200/90 hover:border-emerald-400 ring-1 ring-emerald-500/10'
                    : 'border-yarn-200 hover:border-yarn-400'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase bg-yarn-100 text-yarn-700">
                        {tutorial.source_type === 'pdf' && <FileText className="w-3 h-3 text-sage-600" />}
                        {tutorial.source_type === 'image' && <ImageIcon className="w-3 h-3 text-sage-600" />}
                        {tutorial.source_type === 'text' && <AlignLeft className="w-3 h-3 text-sage-600" />}
                        <span>{((t.library.sourceTypes as any)?.[tutorial.source_type] || tutorial.source_type).toUpperCase()}</span>
                      </span>

                      {/* 100% Finished / Completed Badge */}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 shadow-2xs animate-in fade-in">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{t.library.statusCompleted}</span>
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-yarn-400 font-mono shrink-0">
                      {new Date(tutorial.saved_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                    </span>
                  </div>

                  {/* Title & Note */}
                  <div className="space-y-1.5">
                    <h2 className="text-lg font-bold font-serif text-yarn-900 group-hover:text-yarn-700 transition-colors line-clamp-2">
                      {tutorial.title}
                    </h2>

                    {tutorial.note && (
                      <p className="text-xs text-yarn-600 line-clamp-2 leading-relaxed">
                        {tutorial.note}
                      </p>
                    )}
                  </div>

                  {/* Interactive Progress Track */}
                  {tutorial.totalSteps !== undefined && tutorial.totalSteps > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-medium text-yarn-500">
                        <span>
                          {tutorial.completedSteps || 0} / {tutorial.totalSteps} {t.library.stepsCompletedLabel}
                        </span>
                        <span className={`font-bold font-mono ${isCompleted ? 'text-emerald-700' : 'text-yarn-700'}`}>
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-yarn-100 overflow-hidden border border-yarn-200/50 p-px">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCompleted
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-400'
                              : progress > 0
                              ? 'bg-gradient-to-r from-sage-800 to-sage-600'
                              : 'bg-yarn-200'
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
                    isCompleted ? 'text-emerald-700' : 'text-sage-700'
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
