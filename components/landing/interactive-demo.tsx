'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Sparkles, Globe, Edit3, BookOpen, Info } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useI18n } from '@/lib/i18n/context';
import { StitchTerm } from '@/components/ui/stitch-term';

interface DemoItem {
  id: string;
  original: string;
  translated: string;
  checked: boolean;
  note?: string;
}

const INITIAL_ITEMS: DemoItem[] = [
  {
    id: '1',
    original: 'Round 1: 6 sc in magic ring [6]',
    translated: 'Tour 1 : 6 ms dans un CM [6]',
    checked: true,
  },
  {
    id: '2',
    original: 'Round 2: [inc] x 6 [12]',
    translated: 'Tour 2 : [1 aug] x 6 [12]',
    checked: true,
  },
  {
    id: '3',
    original: 'Round 3: [1 sc, inc] x 6 [18]',
    translated: 'Tour 3 : [1 ms, 1 aug] x 6 [18]',
    checked: false,
    note: 'DEFAULT_NOTE',
  },
  {
    id: '4',
    original: 'Round 4: [2 sc, inc] x 6 [24]',
    translated: 'Tour 4 : [2 ms, 1 aug] x 6 [24]',
    checked: false,
  },
  {
    id: '5',
    original: 'Rounds 5-8: sc around (4 rounds) [24]',
    translated: 'Tours 5-8 : 1 ms dans chaque m (4 tours) [24]',
    checked: false,
  },
];

const KNOWN_TERMS = ['ms', 'aug', 'dim', 'CM', 'mc', 'ml', 'db', 'br', 'm', 'sc', 'inc', 'dec', 'MR', 'sl st', 'ch', 'hdc', 'dc', 'st'];

function renderFormattedStep(text: string) {
  const parts = text.split(/(\bms\b|\baug\b|\bdim\b|\bCM\b|\bmc\b|\bml\b|\bdb\b|\bbr\b|\bsc\b|\binc\b|\bdec\b|\bMR\b|\bsl st\b|\bch\b|\bhdc\b|\bdc\b|\bm\b|\bst\b)/g);

  return parts.map((part, i) => {
    if (KNOWN_TERMS.includes(part)) {
      return <StitchTerm key={i} term={part}>{part}</StitchTerm>;
    }
    return part;
  });
}

export function InteractiveDemo() {
  const { t } = useI18n();
  const [items, setItems] = useState<DemoItem[]>(INITIAL_ITEMS);
  const [isTranslated, setIsTranslated] = useState(true);

  const toggleCheck = (id: string) => {
    setItems((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      const target = next.find((item) => item.id === id);
      if (target?.checked) {
        try {
          confetti({
            particleCount: 35,
            spread: 50,
            origin: { y: 0.75 },
            colors: ['#6E9C7B', '#8EB799', '#B2CEBA', '#509C63'],
          });
        } catch {}
      }
      return next;
    });
  };

  const checkedCount = items.filter((i) => i.checked).length;
  const progressPercent = Math.round((checkedCount / items.length) * 100);

  return (
    <section id="demo" className="py-20 lg:py-28 bg-gradient-to-b from-yarn-50 via-yarn-100/60 to-yarn-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-yarn-200/80 text-yarn-800 border border-yarn-300">
            <Sparkles className="w-3.5 h-3.5 text-sage-600" />
            {t.demo.pill}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-yarn-900 tracking-tight">
            {t.demo.title}
          </h2>
          <p className="text-lg text-yarn-700 leading-relaxed">
            {t.demo.subtitle}
          </p>
        </div>

        {/* Interactive Playground Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Raw original pattern simulation */}
          <div className="lg:col-span-5 bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-yarn-200 shadow-soft">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-yarn-100">
              <div className="flex items-center gap-2 text-yarn-900 font-semibold text-sm">
                <BookOpen className="w-4 h-4 text-yarn-500" />
                <span>{t.demo.rawHeader}</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-yarn-100 text-yarn-700 font-mono">
                {t.demo.sourceLang}
              </span>
            </div>

            <div className="bg-yarn-50/70 rounded-2xl p-4 font-mono text-xs text-yarn-800 leading-relaxed space-y-2 border border-yarn-200/60 select-none">
              <div className="text-yarn-500 font-semibold">{t.demo.rawPatternTitle}</div>
              <div>{t.demo.rawPatternDetails}</div>
              <div className="h-2"></div>
              {INITIAL_ITEMS.map((item) => (
                <div key={item.id} className="hover:text-yarn-950 transition-colors">
                  {item.original}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-yarn-100 text-xs text-yarn-600 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>{t.demo.targetReady}</span>
            </div>
          </div>

          {/* Right Column: The StepByStitch Interactive Checklist */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border-2 border-yarn-300 shadow-lift">
            
            {/* Action Bar / Toggle translation */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-yarn-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-sage-700">
                    {t.demo.checklistPill}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sage-100 text-sage-700 font-medium">
                    {checkedCount} / {items.length} {t.demo.roundsCompleted}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-serif text-yarn-900 mt-1">
                  {t.demo.patternTitle}
                </h3>
              </div>

              {/* Translation Toggle Button */}
              <button
                type="button"
                onClick={() => setIsTranslated(!isTranslated)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isTranslated
                    ? 'bg-yarn-800 text-white shadow-soft'
                    : 'bg-yarn-100 text-yarn-800 hover:bg-yarn-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-sage-500" />
                <span>{isTranslated ? t.demo.toggleToFr : t.demo.toggleToEn}</span>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs font-medium text-yarn-600 mb-1.5">
                <span>{t.demo.progressLabel}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-yarn-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sage-600 to-sage-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Step Items */}
            <div className="space-y-3">
              {items.map((item, index) => {
                const label = isTranslated ? item.translated : item.original;
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`group relative flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                      item.checked
                        ? 'bg-yarn-50/50 border-yarn-200 opacity-75'
                        : 'bg-white border-yarn-200 hover:border-yarn-400 hover:shadow-soft'
                    }`}
                  >
                    <button
                      type="button"
                      aria-label={t.demo.checkRound}
                      className="mt-0.5 flex-shrink-0 text-yarn-700 hover:text-yarn-900 transition-colors"
                    >
                      {item.checked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-5 h-5 text-yarn-400 group-hover:text-yarn-600" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium transition-colors ${
                          item.checked
                            ? 'line-through text-yarn-500'
                            : 'text-yarn-900'
                        }`}
                      >
                        {renderFormattedStep(label)}
                      </div>

                      {item.note && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-yarn-600 bg-yarn-100/70 px-2.5 py-1 rounded-lg">
                          <Edit3 className="w-3 h-3 text-yarn-500" />
                          <span>{item.note === 'DEFAULT_NOTE' ? t.demo.noteExample : item.note}</span>
                        </div>
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-yarn-400">
                      #{index + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer action inside demo */}
            <div className="mt-6 pt-5 border-t border-yarn-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-yarn-600">
              <button
                type="button"
                onClick={() => setItems(INITIAL_ITEMS.map((i) => ({ ...i, checked: false })))}
                className="text-yarn-600 hover:text-sage-700 font-medium underline underline-offset-2"
              >
                {t.demo.uncheckAll}
              </button>
              <div className="text-yarn-500 italic">
                {t.demo.hintClick}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
