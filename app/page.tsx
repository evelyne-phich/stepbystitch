'use client';

import Link from 'next/link';
import {
  CheckCircle,
  Sparkles,
  Globe,
  FileText,
  ShieldCheck,
  Smartphone,
  Layers,
  ArrowRight,
  Edit3,
  BookOpen,
  Eye
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { InteractiveDemo } from '@/components/landing/interactive-demo';
import { PricingSection } from '@/components/landing/pricing-section';
import { CrochetFaq } from '@/components/landing/crochet-faq';
import { useI18n } from '@/lib/i18n/context';

export default function HomePage() {
  const { t, locale } = useI18n();

  return (
    <div className="min-h-screen bg-yarn-50 text-yarn-900 flex flex-col selection:bg-sage-200 selection:text-yarn-900">
      <Navbar />

      <main className="flex-grow">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-yarn-200 bg-gradient-to-b from-yarn-50 via-yarn-100/60 to-yarn-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto space-y-6">

              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-yarn-100 text-yarn-800 border border-yarn-200/80 shadow-soft">
                <Sparkles className="w-3.5 h-3.5 text-sage-600" />
                <span>{t.landing.pill}</span>
              </div>

              {/* Main H1 */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif text-yarn-900 tracking-tight leading-[1.15]">
                {t.landing.heroTitle}{' '}
                <span className="bg-gradient-to-r from-sage-800 via-sage-700 to-sage-600 bg-clip-text text-transparent">
                  {t.landing.heroHighlight}
                </span>{' '}
                {t.landing.heroEnd}
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-yarn-700 max-w-2xl mx-auto leading-relaxed">
                {t.landing.heroSubtitle}
              </p>

              {/* Call to action buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-sage-800 via-sage-700 to-sage-600 hover:from-sage-900 hover:to-sage-700 shadow-lift hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
                >
                  <span>{t.landing.ctaPrimary}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  href="#demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-base font-semibold text-yarn-800 bg-white hover:bg-yarn-100 border border-yarn-300 shadow-soft transition-all"
                >
                  <Sparkles className="w-4 h-4 text-sage-600" />
                  <span>{t.landing.ctaSecondary}</span>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-yarn-600">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{t.landing.badgePrivate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-yarn-600" />
                  <span>{t.landing.badgeFormats}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-sage-600" />
                  <span>{t.landing.badgeTranslation}</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-20 lg:py-28 bg-white border-b border-yarn-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-yarn-100 text-yarn-800 border border-yarn-200">
                <Layers className="w-3.5 h-3.5 text-yarn-600" />
                {t.landing.featuresHeaderPill}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-serif text-yarn-900">
                {t.landing.featuresTitle}
              </h2>
              <p className="text-yarn-700 text-lg">
                {t.landing.featuresSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

              {/* Feature 1 */}
              <div className="bg-yarn-50 rounded-3xl p-8 border border-yarn-200/80 shadow-soft hover:shadow-lift transition-all flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-sage-100 text-sage-700 flex items-center justify-center mb-6">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-serif text-yarn-900 mb-3">
                  {t.landing.feature1Title}
                </h3>
                <p className="text-yarn-700 text-sm leading-relaxed flex-1">
                  {t.landing.feature1Desc}
                </p>
                <div className="mt-6 pt-4 border-t border-yarn-200 text-xs font-semibold text-sage-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.landing.feature1Badge}</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-yarn-50 rounded-3xl p-8 border border-yarn-200/80 shadow-soft hover:shadow-lift transition-all flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-yarn-200 text-yarn-800 flex items-center justify-center mb-6">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-serif text-yarn-900 mb-3">
                  {t.landing.feature2Title}
                </h3>
                <p className="text-yarn-700 text-sm leading-relaxed flex-1">
                  {t.landing.feature2Desc}
                </p>
                <div className="mt-6 pt-4 border-t border-yarn-200 text-xs font-semibold text-yarn-800 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{t.landing.feature2Badge}</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-yarn-50 rounded-3xl p-8 border border-yarn-200/80 shadow-soft hover:shadow-lift transition-all flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-sage-100 text-sage-700 flex items-center justify-center mb-6">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-serif text-yarn-900 mb-3">
                  {t.landing.feature3Title}
                </h3>
                <p className="text-yarn-700 text-sm leading-relaxed flex-1">
                  {t.landing.feature3Desc}
                </p>
                <div className="mt-6 pt-4 border-t border-yarn-200 text-xs font-semibold text-sage-800 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t.landing.feature3Badge}</span>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="bg-yarn-50 rounded-3xl p-8 border border-yarn-200/80 shadow-soft hover:shadow-lift transition-all flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-yarn-200 text-yarn-800 flex items-center justify-center mb-6">
                  <Edit3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-serif text-yarn-900 mb-3">
                  {t.landing.feature4Title}
                </h3>
                <p className="text-yarn-700 text-sm leading-relaxed flex-1">
                  {t.landing.feature4Desc}
                </p>
                <div className="mt-6 pt-4 border-t border-yarn-200 text-xs font-semibold text-yarn-800 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t.landing.feature4Badge}</span>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="bg-yarn-50 rounded-3xl p-8 border border-yarn-200/80 shadow-soft hover:shadow-lift transition-all flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-sage-100 text-sage-700 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-serif text-yarn-900 mb-3">
                  {t.landing.feature5Title}
                </h3>
                <p className="text-yarn-700 text-sm leading-relaxed flex-1">
                  {t.landing.feature5Desc}
                </p>
                <div className="mt-6 pt-4 border-t border-yarn-200 text-xs font-semibold text-sage-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t.landing.feature5Badge}</span>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="bg-yarn-50 rounded-3xl p-8 border border-yarn-200/80 shadow-soft hover:shadow-lift transition-all flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-sage-100 text-sage-700 flex items-center justify-center mb-6">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-serif text-yarn-900 mb-3">
                  {t.landing.feature6Title}
                </h3>
                <p className="text-yarn-700 text-sm leading-relaxed flex-1">
                  {t.landing.feature6Desc}
                </p>
                <div className="mt-6 pt-4 border-t border-yarn-200 text-xs font-semibold text-sage-800 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{t.landing.feature6Badge}</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* INTERACTIVE DEMO SIMULATOR */}
        <InteractiveDemo />

        {/* SEO TEASER / CROCHET GLOSSARY BANNER */}
        <section className="py-16 bg-gradient-to-r from-yarn-800 to-yarn-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-3 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-sage-500/20 text-sage-300 border border-sage-500/30">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{t.common.abbreviationsGuide}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
                  {t.landing.teaserTitle}
                </h3>
                <p className="text-yarn-300 text-sm sm:text-base max-w-2xl">
                  {t.landing.teaserSubtitle}
                </p>
              </div>

              <Link
                href={locale === 'fr' ? '/guide-abbreviations-crochet' : '/crochet-abbreviations-guide'}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-yarn-900 bg-white hover:bg-yarn-100 shadow-soft hover:shadow-lift transition-all whitespace-nowrap"
              >
                <span>{t.landing.teaserButton}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* PRICING PLANS SECTION */}
        <PricingSection />

        {/* FAQ ACCORDION */}
        <CrochetFaq />

        {/* FINAL CALL TO ACTION */}
        <section className="py-20 lg:py-28 bg-gradient-to-b from-yarn-50 to-yarn-100 border-t border-yarn-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sage-800 to-sage-600 flex items-center justify-center text-white mx-auto shadow-lift">
              <Sparkles className="w-8 h-8" />
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-yarn-900">
              {t.landing.ctaBannerTitle}
            </h2>

            <p className="text-lg text-yarn-700 max-w-2xl mx-auto leading-relaxed">
              {t.landing.ctaBannerSubtitle}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-9 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-sage-800 via-sage-700 to-sage-600 hover:from-sage-900 hover:to-sage-700 shadow-lift transition-all transform hover:-translate-y-0.5"
              >
                <span>{t.landing.ctaPrimary}</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
