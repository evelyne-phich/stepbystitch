'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, BookOpen, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useI18n } from '@/lib/i18n/context';

interface Term {
  fr: string;
  frAbbr: string;
  us: string;
  usAbbr: string;
  uk: string;
  ukAbbr: string;
  descriptionFr: string;
  descriptionEn: string;
}

const CROCHET_TERMS: Term[] = [
  {
    fr: "Maille en l'air",
    frAbbr: 'ml',
    us: 'Chain',
    usAbbr: 'ch',
    uk: 'Chain',
    ukAbbr: 'ch',
    descriptionFr: 'Point de base pour démarrer un ouvrage ou monter en hauteur de rang.',
    descriptionEn: 'Foundation stitch used to start a project or build row height.',
  },
  {
    fr: 'Maille coulée',
    frAbbr: 'mc',
    us: 'Slip stitch',
    usAbbr: 'sl st / ss',
    uk: 'Slip stitch',
    ukAbbr: 'sl st / ss',
    descriptionFr: 'Sert à fermer un tour ou déplacer le fil de travail de façon invisible.',
    descriptionEn: 'Used to join rounds or move the working yarn invisibly across stitches.',
  },
  {
    fr: 'Maille serrée',
    frAbbr: 'ms',
    us: 'Single crochet',
    usAbbr: 'sc',
    uk: 'Double crochet',
    ukAbbr: 'dc',
    descriptionFr: 'Le point d\'amigurumi par excellence : dense, serré et régulier.',
    descriptionEn: 'The standard amigurumi stitch: dense, tight, and seamless.',
  },
  {
    fr: 'Demi-bride',
    frAbbr: 'db',
    us: 'Half double crochet',
    usAbbr: 'hdc',
    uk: 'Half treble crochet',
    ukAbbr: 'htr',
    descriptionFr: 'Hauteur intermédiaire apportant souplesse et texture.',
    descriptionEn: 'Intermediate height stitch providing softness and texture.',
  },
  {
    fr: 'Bride',
    frAbbr: 'br',
    us: 'Double crochet',
    usAbbr: 'dc',
    uk: 'Treble crochet',
    ukAbbr: 'tr',
    descriptionFr: 'Point aéré classique, idéal pour plaids, châles et vêtements.',
    descriptionEn: 'Classic openwork stitch, popular for blankets, shawls, and garments.',
  },
  {
    fr: 'Double bride',
    frAbbr: 'dbr',
    us: 'Treble crochet',
    usAbbr: 'tr',
    uk: 'Double treble crochet',
    ukAbbr: 'dtr',
    descriptionFr: 'Grand point nécessitant deux jetés avant de piquer dans la maille.',
    descriptionEn: 'Tall stitch requiring two yarn overs before inserting hook.',
  },
  {
    fr: 'Augmentation',
    frAbbr: 'aug / augm',
    us: 'Increase',
    usAbbr: 'inc',
    uk: 'Increase',
    ukAbbr: 'inc',
    descriptionFr: 'Crocheter 2 mailles (ou plus) dans la même maille du rang précédent.',
    descriptionEn: 'Work 2 (or more) stitches into the same stitch of the previous row.',
  },
  {
    fr: 'Diminution',
    frAbbr: 'dim',
    us: 'Decrease / sc2tog',
    usAbbr: 'dec / sc2tog',
    uk: 'Decrease / dc2tog',
    ukAbbr: 'dec / dc2tog',
    descriptionFr: 'Écouler 2 mailles ensemble pour réduire le nombre total de mailles.',
    descriptionEn: 'Work 2 stitches together to reduce the total stitch count.',
  },
  {
    fr: 'Cercle magique',
    frAbbr: 'CM',
    us: 'Magic ring / Magic loop',
    usAbbr: 'MR',
    uk: 'Magic ring',
    ukAbbr: 'MR',
    descriptionFr: 'Boucle ajustable pour commencer le crochet en rond sans trou central.',
    descriptionEn: 'Adjustable loop for starting crochet in the round without a center hole.',
  },
  {
    fr: 'Brin avant uniquement',
    frAbbr: 'BAV',
    us: 'Front loop only',
    usAbbr: 'FLO',
    uk: 'Front loop only',
    ukAbbr: 'FLO',
    descriptionFr: 'Piquer le crochet uniquement sous le brin avant le plus proche de vous.',
    descriptionEn: 'Insert hook under the front loop closest to you.',
  },
  {
    fr: 'Brin arrière uniquement',
    frAbbr: 'BAR',
    us: 'Back loop only',
    usAbbr: 'BLO',
    uk: 'Back loop only',
    ukAbbr: 'BLO',
    descriptionFr: 'Piquer le crochet uniquement sous le brin arrière le plus éloigné de vous.',
    descriptionEn: 'Insert hook under the back loop farthest from you.',
  },
  {
    fr: 'Point noisette / pop-corn',
    frAbbr: 'noisette',
    us: 'Bobble stitch / Popcorn',
    usAbbr: 'bo / pop',
    uk: 'Bobble stitch',
    ukAbbr: 'bo',
    descriptionFr: 'Groupe de brides rabattues ensemble pour créer un relief en 3D.',
    descriptionEn: 'Cluster of double crochets worked together to create raised 3D texture.',
  },
];

export function AbbreviationsGuideView() {
  const { t, locale } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-yarn-50">
      <Navbar />

      <main className="flex-1 py-12 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-yarn-600 hover:text-yarn-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.abbreviationsPage.backToHome}
          </Link>

          {/* Header */}
          <div className="space-y-4 mb-12 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-yarn-200 text-yarn-800">
              <BookOpen className="w-3.5 h-3.5 text-yarn-600" />
              <span>{t.abbreviationsPage.pill}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-yarn-900">
              {t.abbreviationsPage.title}
            </h1>
            <p className="text-base sm:text-lg text-yarn-700 leading-relaxed">
              {t.abbreviationsPage.subtitle}
            </p>
          </div>

          {/* Attention alert: US vs UK */}
          <div className="p-6 rounded-3xl bg-sage-50 border border-sage-200/80 mb-12 flex flex-col sm:flex-row gap-4 items-start">
            <div className="w-10 h-10 rounded-2xl bg-sage-700 text-white flex items-center justify-center font-bold font-serif flex-shrink-0">
              !
            </div>
            <div className="space-y-1 text-sm text-sage-950">
              <h2 className="font-bold text-base">{t.abbreviationsPage.alertTitle}</h2>
              <p className="text-sage-800 leading-relaxed">
                {t.abbreviationsPage.alertDesc}
              </p>
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="bg-white rounded-3xl border border-yarn-200 shadow-soft overflow-hidden mb-16">
            <div className="p-6 border-b border-yarn-100 bg-yarn-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold font-serif text-yarn-900">
                {t.abbreviationsPage.tableTitle}
              </h2>
              <span className="text-xs text-yarn-600 font-medium">
                {CROCHET_TERMS.length} {t.abbreviationsPage.termsCount}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-yarn-100/60 border-b border-yarn-200 text-yarn-800 font-serif">
                    <th className="py-4 px-6 font-bold">{t.abbreviationsPage.colUs}</th>
                    <th className="py-4 px-6 font-bold">{t.abbreviationsPage.colUk}</th>
                    <th className="py-4 px-6 font-bold">{t.abbreviationsPage.colFr}</th>
                    <th className="py-4 px-6 font-bold hidden md:table-cell">{t.abbreviationsPage.colDesc}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yarn-100">
                  {CROCHET_TERMS.map((term, index) => (
                    <tr key={index} className="hover:bg-yarn-50/60 transition-colors">
                      <td className="py-4 px-6 text-yarn-800">
                        <div>{term.us}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-yarn-200 text-yarn-800">
                          {term.usAbbr}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-yarn-800">
                        <div>{term.uk}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-sage-100 text-sage-800">
                          {term.ukAbbr}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-medium text-yarn-900">
                        <div>{term.fr}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-yarn-200/80 text-yarn-800">
                          {term.frAbbr}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-yarn-600 text-xs hidden md:table-cell">
                        {locale === 'fr' ? term.descriptionFr : term.descriptionEn}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Call to action */}
          <div className="bg-gradient-to-tr from-yarn-800 to-yarn-900 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-lift">
            <div className="w-14 h-14 rounded-2xl bg-sage-500/30 text-sage-300 flex items-center justify-center mx-auto border border-sage-500/40">
              <Sparkles className="w-7 h-7" />
            </div>
            
            <div className="space-y-2 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold font-serif">
                {t.abbreviationsPage.ctaTitle}
              </h2>
              <p className="text-yarn-300 text-sm sm:text-base">
                {t.abbreviationsPage.ctaSubtitle}
              </p>
            </div>

            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-yarn-900 bg-white hover:bg-yarn-100 shadow-soft transition-transform transform hover:-translate-y-0.5"
            >
              <span>{t.abbreviationsPage.ctaButton}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
