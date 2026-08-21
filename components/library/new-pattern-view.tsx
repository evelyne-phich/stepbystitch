'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  AlignLeft,
  Lock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { UploadDropzone } from '@/components/library/upload-dropzone';
import type { QuotaCheckResult } from '@/lib/ai/usage-tracker';

interface NewPatternViewProps {
  quota: QuotaCheckResult;
}

export function NewPatternView({ quota }: NewPatternViewProps) {
  const { t } = useI18n();
  const maxAllowed = quota.maxAllowed ?? 3;
  const isQuotaReached = !quota.isUnlimited && quota.currentCount >= maxAllowed;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 transition-all duration-300">
      
      {/* Back Link */}
      <div>
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-yarn-600 hover:text-yarn-950 transition-colors p-1 -ml-1 rounded-lg hover:bg-yarn-100/60"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.upload.backToLibrary}</span>
        </Link>
      </div>

      {/* Page Header + Quota Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-yarn-950 tracking-tight">
            {t.upload.title}
          </h1>
          <p className="text-xs sm:text-sm text-yarn-600 max-w-2xl">
            {t.upload.subtitle}
          </p>
        </div>

        {/* Dynamic Quota Badge (Green when active, Red when limit reached) */}
        {!quota.isUnlimited && (
          <div
            className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl text-xs font-semibold border shadow-soft self-start sm:self-auto transition-all ${
              isQuotaReached
                ? 'bg-rose-50 border-rose-200 text-rose-950 shadow-rose-900/10 ring-1 ring-rose-300/50'
                : 'bg-white border-yarn-200 text-yarn-800'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isQuotaReached
                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                  : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse'
              }`}
            />
            <span className="whitespace-nowrap">
              {t.upload.freePlanPrefix}{' '}
              <strong className={isQuotaReached ? 'text-rose-950 font-bold' : 'text-yarn-950 font-bold'}>
                {quota.currentCount} / {maxAllowed}
              </strong>{' '}
              {t.upload.patternsUnit}
            </span>
          </div>
        )}
      </div>

      {/* Prominent Quota Limit Reached Upgrade Notice */}
      {isQuotaReached && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-rose-200/90 shadow-soft animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0 shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold font-serif text-yarn-950">
                  {t.upload.quotaWarningTitle}
                </h3>
                <p className="text-xs sm:text-sm text-yarn-600 max-w-2xl leading-relaxed">
                  {t.upload.quotaWarningDesc}
                </p>
              </div>
            </div>
            <Link
              href="/#tarifs"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-sage-800 hover:bg-sage-900 shadow-soft transition-all shrink-0 hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>{t.upload.upgradeCta}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Quick Tips Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-yarn-200/90 shadow-soft flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-2xl bg-sage-100 text-sage-800 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <strong className="font-bold text-yarn-950 block text-sm">{t.upload.pdfCardTitle}</strong>
            <p className="text-yarn-600 leading-relaxed">
              {t.upload.pdfCardDesc}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-yarn-200/90 shadow-soft flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-2xl bg-yarn-100 text-yarn-800 flex items-center justify-center shrink-0">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <strong className="font-bold text-yarn-950 block text-sm">{t.upload.imagesCardTitle}</strong>
            <p className="text-yarn-600 leading-relaxed">
              {t.upload.imagesCardDesc}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-yarn-200/90 shadow-soft flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-2xl bg-sage-100 text-sage-800 flex items-center justify-center shrink-0">
            <AlignLeft className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <strong className="font-bold text-yarn-950 block text-sm">{t.upload.textCardTitle}</strong>
            <p className="text-yarn-600 leading-relaxed">
              {t.upload.textCardDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Main Upload Dropzone */}
      <UploadDropzone quota={quota} />

    </div>
  );
}
