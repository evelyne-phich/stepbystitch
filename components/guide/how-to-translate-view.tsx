'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Globe } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useI18n } from '@/lib/i18n/context';

export function HowToTranslateView() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-yarn-50">
      <Navbar />

      <main className="flex-1 py-12 lg:py-20">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-yarn-600 hover:text-yarn-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.howToTranslate.backToHome}
          </Link>

          <header className="space-y-4 mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-yarn-200 text-yarn-800">
              <Globe className="w-3.5 h-3.5 text-sage-600" />
              {t.howToTranslate.pill}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-yarn-900 leading-tight">
              {t.howToTranslate.title}
            </h1>
            <p className="text-lg text-yarn-700 leading-relaxed">
              {t.howToTranslate.subtitle}
            </p>
          </header>

          <div className="prose prose-yarn max-w-none text-yarn-800 space-y-8 leading-relaxed">
            
            {/* Step 1 */}
            <section className="bg-white p-8 rounded-3xl border border-yarn-200 shadow-soft">
              <h2 className="text-2xl font-serif font-bold text-yarn-900 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-yarn-100 text-yarn-800 flex items-center justify-center text-sm font-sans font-bold">{t.howToTranslate.step1Num}</span>
                {t.howToTranslate.step1Title}
              </h2>
              <p className="text-sm sm:text-base text-yarn-700 mb-4">
                {t.howToTranslate.step1Desc}
              </p>
              <ul className="space-y-2 text-sm text-yarn-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                  <span><strong>{t.howToTranslate.step1UsTitle}</strong> {t.howToTranslate.step1UsDesc}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                  <span><strong>{t.howToTranslate.step1UkTitle}</strong> {t.howToTranslate.step1UkDesc}</span>
                </li>
              </ul>
            </section>

            {/* Step 2 */}
            <section className="bg-white p-8 rounded-3xl border border-yarn-200 shadow-soft">
              <h2 className="text-2xl font-serif font-bold text-yarn-900 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-yarn-100 text-yarn-800 flex items-center justify-center text-sm font-sans font-bold">{t.howToTranslate.step2Num}</span>
                {t.howToTranslate.step2Title}
              </h2>
              <p className="text-sm sm:text-base text-yarn-700 mb-4">
                {t.howToTranslate.step2Desc}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-mono">
                <div className="p-3 rounded-xl bg-yarn-50 border border-yarn-200">
                  <strong className="text-sage-800 font-bold">ch</strong> (Chain) = <strong className="text-yarn-900 font-bold">ml</strong> <span className="text-yarn-600 font-sans text-xs">(maille en l&apos;air)</span>
                </div>
                <div className="p-3 rounded-xl bg-yarn-50 border border-yarn-200">
                  <strong className="text-sage-800 font-bold">sc</strong> (Single Crochet) = <strong className="text-yarn-900 font-bold">ms</strong> <span className="text-yarn-600 font-sans text-xs">(maille serrée)</span>
                </div>
                <div className="p-3 rounded-xl bg-yarn-50 border border-yarn-200">
                  <strong className="text-sage-800 font-bold">inc</strong> (Increase) = <strong className="text-yarn-900 font-bold">aug</strong> <span className="text-yarn-600 font-sans text-xs">(augmentation)</span>
                </div>
                <div className="p-3 rounded-xl bg-yarn-50 border border-yarn-200">
                  <strong className="text-sage-800 font-bold">dec</strong> (Decrease) = <strong className="text-yarn-900 font-bold">dim</strong> <span className="text-yarn-600 font-sans text-xs">(diminution)</span>
                </div>
                <div className="p-3 rounded-xl bg-yarn-50 border border-yarn-200">
                  <strong className="text-sage-800 font-bold">MR</strong> (Magic Ring) = <strong className="text-yarn-900 font-bold">CM</strong> <span className="text-yarn-600 font-sans text-xs">(cercle magique)</span>
                </div>
                <div className="p-3 rounded-xl bg-yarn-50 border border-yarn-200">
                  <strong className="text-sage-800 font-bold">sl st</strong> (Slip Stitch) = <strong className="text-yarn-900 font-bold">mc</strong> <span className="text-yarn-600 font-sans text-xs">(maille coulée)</span>
                </div>
              </div>
            </section>

            {/* Step 3 */}
            <section className="bg-white p-8 rounded-3xl border border-yarn-200 shadow-soft">
              <h2 className="text-2xl font-serif font-bold text-yarn-900 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-yarn-100 text-yarn-800 flex items-center justify-center text-sm font-sans font-bold">{t.howToTranslate.step3Num}</span>
                {t.howToTranslate.step3Title}
              </h2>
              <p className="text-sm sm:text-base text-yarn-700 mb-4">
                {t.howToTranslate.step3Desc1}
              </p>
              <p className="text-sm sm:text-base text-yarn-700">
                {t.howToTranslate.step3Desc2}
              </p>
            </section>

          </div>

          {/* CTA Box */}
          <div className="mt-12 bg-gradient-to-tr from-yarn-800 to-sage-800 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-lift">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif">
              {t.howToTranslate.ctaTitle}
            </h2>
            <p className="text-yarn-100 text-sm sm:text-base max-w-xl mx-auto">
              {t.howToTranslate.ctaSubtitle}
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-yarn-900 bg-white hover:bg-yarn-100 shadow-soft transition-transform transform hover:-translate-y-0.5"
            >
              <span>{t.howToTranslate.ctaButton}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

        </article>
      </main>

      <Footer />
    </div>
  );
}
