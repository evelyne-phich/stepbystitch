'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, Image as ImageIcon, AlignLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { UploadDropzone } from '@/components/library/upload-dropzone';

import type { QuotaCheckResult } from '@/lib/ai/usage-tracker';

interface NewPatternViewProps {
  quota: QuotaCheckResult;
}

export function NewPatternView({ quota }: NewPatternViewProps) {
  const { t } = useI18n();

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* Back Link */}
      <Link
        href="/library"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-yarn-600 hover:text-yarn-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t.upload.backToLibrary}</span>
      </Link>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-yarn-900">
            {t.upload.title}
          </h1>
          <p className="text-xs sm:text-sm text-yarn-600">
            {t.upload.subtitle}
          </p>
        </div>

        {/* Quota Badge */}
        {!quota.isUnlimited && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-yarn-200 shadow-soft self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-sage-500 animate-pulse" />
            <span className="text-yarn-700">
              {t.upload.freePlanPrefix}{' '}
              <strong className="text-yarn-950 font-bold">
                {quota.currentCount} / {quota.maxAllowed}
              </strong>{' '}
              {t.upload.patternsUnit}
            </span>
          </div>
        )}
      </div>

      {/* Quick Tips Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-white border border-yarn-200/80 shadow-soft flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-sage-100 text-sage-700 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-0.5">
            <strong className="font-semibold text-yarn-900 block">{t.upload.pdfCardTitle}</strong>
            <p className="text-yarn-600 leading-relaxed">
              {t.upload.pdfCardDesc}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-yarn-200/80 shadow-soft flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-yarn-100 text-yarn-800 flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-0.5">
            <strong className="font-semibold text-yarn-900 block">{t.upload.imagesCardTitle}</strong>
            <p className="text-yarn-600 leading-relaxed">
              {t.upload.imagesCardDesc}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-yarn-200/80 shadow-soft flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-sage-100 text-sage-700 flex items-center justify-center flex-shrink-0">
            <AlignLeft className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-0.5">
            <strong className="font-semibold text-yarn-900 block">{t.upload.textCardTitle}</strong>
            <p className="text-yarn-600 leading-relaxed">
              {t.upload.textCardDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Main Upload Dropzone */}
      <UploadDropzone />

    </div>
  );
}
