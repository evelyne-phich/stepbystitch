'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles, ShieldCheck, Zap, ArrowRight, Layers } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

export function PricingSection() {
  const { t, locale } = useI18n();
  const [isYearly, setIsYearly] = useState(true);

  const { pricingSection } = t;

  return (
    <section id="tarifs" className="py-20 lg:py-28 bg-yarn-50 border-t border-yarn-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-yarn-200 text-yarn-800 border border-yarn-300">
            <Sparkles className="w-3.5 h-3.5 text-sage-600" />
            <span>{pricingSection.pill}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-yarn-900 tracking-tight">
            {pricingSection.title}
          </h2>

          <p className="text-lg text-yarn-700 leading-relaxed">
            {pricingSection.subtitle}
          </p>

          {/* Monthly / Yearly Billing Toggle */}
          <div className="pt-4 flex items-center justify-center gap-4">
            <span
              className={`text-sm font-semibold transition-colors cursor-pointer ${
                !isYearly ? 'text-yarn-900' : 'text-yarn-500 hover:text-yarn-700'
              }`}
              onClick={() => setIsYearly(false)}
            >
              {pricingSection.billingMonthly}
            </span>

            <button
              type="button"
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-14 h-8 bg-yarn-300 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-500"
              aria-label={pricingSection.toggleBilling}
            >
              <div
                className={`w-6 h-6 rounded-full bg-sage-700 shadow-md transform transition-transform ${
                  isYearly ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>

            <span
              className={`text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
                isYearly ? 'text-yarn-900' : 'text-yarn-500 hover:text-yarn-700'
              }`}
              onClick={() => setIsYearly(true)}
            >
              <span>{pricingSection.billingYearly}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sage-100 text-sage-800 border border-sage-300">
                {pricingSection.saveBadge}
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">

          {/* FREE PLAN CARD */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-yarn-200/90 shadow-soft hover:shadow-lift transition-all flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold font-serif text-yarn-900">
                    {pricingSection.freePlanName}
                  </h3>
                  <p className="text-sm text-yarn-600 mt-1">
                    {pricingSection.freePlanBadge}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-yarn-100 text-yarn-700 flex items-center justify-center flex-shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
              </div>

              {/* Price */}
              <div className="pt-2 pb-4 border-b border-yarn-100 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black font-serif text-yarn-900">
                  {pricingSection.freePriceMonthly}
                </span>
                <span className="text-sm font-medium text-yarn-600">
                  / {pricingSection.freePriceSub}
                </span>
              </div>

              {/* Features List */}
              <ul className="space-y-3.5 text-sm">
                {pricingSection.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        idx === 0 ? 'bg-yarn-200 text-yarn-900' : 'bg-yarn-100 text-yarn-700'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className={idx === 0 ? 'font-bold text-yarn-950' : 'text-yarn-700'}>
                      {feature.free}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/signup"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm text-yarn-900 bg-yarn-100 hover:bg-yarn-200 border border-yarn-300 transition-all text-center"
              >
                <span>{pricingSection.freeCta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* UNLIMITED PLAN CARD (FEATURED) */}
          <div className="relative bg-gradient-to-b from-white via-sage-50/40 to-white rounded-3xl p-8 sm:p-10 border-2 border-sage-500 shadow-lift hover:shadow-2xl transition-all flex flex-col justify-between">
            {/* Popular Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-sage-800 to-sage-600 text-white shadow-soft">
              {pricingSection.paidPlanBadge}
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold font-serif text-yarn-900">
                    {pricingSection.paidPlanName}
                  </h3>
                  <p className="text-sm text-yarn-600 mt-1">
                    {pricingSection.paidPlanBadge}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-sage-100 text-sage-700 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-sage-600" />
                </div>
              </div>

              {/* Price */}
              <div className="pt-2 pb-4 border-b border-yarn-100">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black font-serif text-yarn-900">
                    {isYearly ? pricingSection.paidPriceYearly : pricingSection.paidPriceMonthly}
                  </span>
                  <span className="text-sm font-medium text-yarn-600">
                    / {isYearly ? pricingSection.paidPriceSubYearly : pricingSection.paidPriceSubMonthly}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-3.5 text-sm">
                {pricingSection.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        idx === 0
                          ? 'bg-sage-700 text-white shadow-xs'
                          : 'bg-sage-100 text-sage-800'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span
                      className={
                        idx === 0
                          ? 'font-bold text-sage-950 bg-sage-100/80 px-2 py-0.5 rounded-lg -ml-1 inline-block'
                          : 'text-yarn-800 font-normal'
                      }
                    >
                      {feature.paid}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/signup?plan=unlimited"
                className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-sage-800 to-sage-600 hover:from-sage-900 hover:to-sage-700 shadow-lift hover:shadow-2xl transition-all transform hover:-translate-y-0.5 text-center"
              >
                <span>{pricingSection.paidCta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>

        {/* Guarantee Banner & Terms Notice */}
        <div className="mt-12 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-yarn-600">
            <ShieldCheck className="w-4 h-4 text-sage-600" />
            <span>{pricingSection.guaranteeText}</span>
          </div>
          <p className="text-[11px] text-yarn-600 font-medium">
            <span>{pricingSection.fairUseNoticePrefix} </span>
            <Link
              href={locale === 'fr' ? '/cgu' : '/terms'}
              className="text-sage-800 underline underline-offset-2 hover:text-sage-950 font-semibold transition-colors"
            >
              {pricingSection.fairUseNoticeLink}
            </Link>
            <span>.</span>
          </p>
        </div>

      </div>
    </section>
  );
}
