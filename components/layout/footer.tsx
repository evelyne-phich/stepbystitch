'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { CrochetLogo } from '@/components/ui/crochet-logo';

export function Footer() {
  const { t, locale } = useI18n();

  return (
    <footer className="bg-yarn-900 text-yarn-100 border-t border-yarn-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <CrochetLogo size="sm" className="text-sage-300" />
              <span className="text-xl font-bold font-serif tracking-tight text-white">
                {t.common.brandName}
              </span>
            </div>
            <p className="text-sm text-yarn-300 leading-relaxed">
              {t.landing.featuresSubtitle}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-yarn-400">
              <span>{t.common.madeWithLove}</span>
              <Heart className="w-3.5 h-3.5 text-sage-400 fill-sage-400" />
            </div>
            <div className="pt-2">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-yarn-300 mb-4">
              {t.common.features}
            </h3>
            <ul className="space-y-2.5 text-sm text-yarn-300">
              <li>
                <Link href="/#features" className="hover:text-white transition-colors">
                  {t.landing.feature1Title}
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-white transition-colors">
                  {t.landing.feature2Title}
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-white transition-colors">
                  {t.landing.feature3Title}
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-white transition-colors">
                  {t.landing.feature4Title}
                </Link>
              </li>
            </ul>
          </div>

          {/* SEO Guides & Resources Column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-yarn-300 mb-4">
              {t.common.abbreviationsGuide} & FAQ
            </h3>
            <ul className="space-y-2.5 text-sm text-yarn-300">
              <li>
                <Link
                  href={locale === 'fr' ? '/guide-abbreviations-crochet' : '/crochet-abbreviations-guide'}
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>{t.landing.teaserTitle}</span>
                </Link>
              </li>
              <li>
                <Link
                  href={locale === 'fr' ? '/comment-traduire-patron-crochet' : '/how-to-translate-crochet-patterns'}
                  className="hover:text-white transition-colors"
                >
                  {t.common.howToTranslateGuide}
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition-colors">
                  {t.common.faq}
                </Link>
              </li>
              <li>
                <Link href="/#demo" className="hover:text-white transition-colors">
                  {t.common.demo}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account / Legal Column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-yarn-300 mb-4">
              {t.common.privacy}
            </h3>
            <ul className="space-y-2.5 text-sm text-yarn-300">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  {t.common.login}
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition-colors">
                  {t.common.createAccount}
                </Link>
              </li>
              <li>
                <span className="text-xs text-yarn-400 block pt-2">
                  {t.landing.feature5Desc}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-yarn-800 flex flex-col sm:flex-row items-center justify-between text-xs text-yarn-400 gap-4">
          <p>© {new Date().getFullYear()} {t.common.brandName}. {t.common.allRightsReserved}</p>
          <p className="flex items-center gap-4">
            <span>{t.landing.badgePrivate}</span>
            <span>•</span>
            <span>RLS Cloud Storage</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
