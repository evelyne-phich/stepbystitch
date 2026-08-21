'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, FileText, Lock, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

export default function TermsPage() {
  const { t } = useI18n();
  const { cgu } = t;

  return (
    <div className="min-h-screen bg-yarn-50 text-yarn-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-yarn-700 hover:text-yarn-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{cgu.backToHome}</span>
        </Link>

        {/* Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-yarn-200 shadow-soft space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sage-100 text-sage-900 border border-sage-200">
            <FileText className="w-3.5 h-3.5 text-sage-700" />
            <span>{cgu.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-yarn-950">
            {cgu.title}
          </h1>
          <p className="text-xs text-yarn-500">
            {cgu.lastUpdatedPrefix} {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-yarn-200 shadow-soft space-y-8 text-sm leading-relaxed text-yarn-800">
          
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold font-serif text-yarn-950 flex items-center gap-2">
              <span>{cgu.section1Title}</span>
            </h2>
            <p>{cgu.section1Content}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold font-serif text-yarn-950 flex items-center gap-2">
              <Lock className="w-4 h-4 text-sage-700" />
              <span>{cgu.section2Title}</span>
            </h2>
            <p>{cgu.section2Content}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold font-serif text-yarn-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sage-700" />
              <span>{cgu.section3Title}</span>
            </h2>
            <p>{cgu.section3Content}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold font-serif text-yarn-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sage-700" />
              <span>{cgu.section4Title}</span>
            </h2>
            <p>{cgu.section4Content}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold font-serif text-yarn-950 flex items-center gap-2">
              <span>{cgu.section5Title}</span>
            </h2>
            <p>{cgu.section5Content}</p>
          </section>

        </div>

      </div>
    </div>
  );
}
