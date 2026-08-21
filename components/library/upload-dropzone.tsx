'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  AlignLeft,
  X,
  Plus,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Loader2,
  Clock,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Toast } from '@/components/ui/toast';
import type { QuotaCheckResult } from '@/lib/ai/usage-tracker';

interface FilePreview {
  file: File;
  previewUrl?: string;
}

interface UploadDropzoneProps {
  quota?: QuotaCheckResult;
}

export function UploadDropzone({ quota }: UploadDropzoneProps = {}) {
  const { t } = useI18n();
  const router = useRouter();

  const isBlocked = !!(quota && !quota.isUnlimited && quota.currentCount >= (quota.maxAllowed ?? 3));

  // Ref for auto-scrolling to submit/progress area
  const submitSectionRef = useRef<HTMLDivElement>(null);

  // Mode: 'file' or 'text'
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');

  // Files state
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Raw text state
  const [rawText, setRawText] = useState('');

  // Details
  const [customTitle, setCustomTitle] = useState('');
  const [customNote, setCustomNote] = useState('');

  // Loading & Progress
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: 'error' | 'info' | 'success';
  } | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Drag & drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    setErrorMessage(null);
    const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

    const validPreviews: FilePreview[] = [];

    for (const file of newFiles) {
      if (file.size > MAX_SIZE_BYTES) {
        setErrorMessage(t.upload.fileTooLarge);
        return;
      }

      const isImage = file.type.startsWith('image/');
      validPreviews.push({
        file,
        previewUrl: isImage ? URL.createObjectURL(file) : undefined,
      });
    }

    setSelectedFiles((prev) => [...prev, ...validPreviews]);
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => {
      const target = prev[indexToRemove];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const clearAllFiles = () => {
    selectedFiles.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setSelectedFiles([]);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setQuotaExceeded(false);

    if (isBlocked) {
      setQuotaExceeded(true);
      return;
    }

    const hasFiles = selectedFiles.length > 0;
    const hasText = rawText.trim().length > 0;

    if (activeTab === 'file' && !hasFiles) {
      setErrorMessage(t.upload.errorEmpty);
      return;
    }

    if (activeTab === 'text' && !hasText) {
      setErrorMessage(t.upload.errorEmpty);
      return;
    }

    setIsSubmitting(true);
    setCurrentStepIndex(0);

    // Auto-scroll smoothly to ensure loading progress is in full view
    setTimeout(() => {
      submitSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);

    // Simulated progress steps for smooth UX
    const stepTimer1 = setTimeout(() => setCurrentStepIndex(1), 1500);
    const stepTimer2 = setTimeout(() => setCurrentStepIndex(2), 5000);

    try {
      const formData = new FormData();

      if (activeTab === 'file') {
        selectedFiles.forEach(({ file }) => {
          formData.append('files', file);
        });
      } else {
        formData.append('rawText', rawText);
      }

      if (customTitle.trim()) {
        formData.append('title', customTitle.trim());
      }
      if (customNote.trim()) {
        formData.append('note', customNote.trim());
      }

      const response = await fetch('/api/parse-pattern', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.status === 401) {
        setErrorMessage(t.upload.errorUnauthorized);
        setIsSubmitting(false);
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        return;
      }

      if (response.status === 403 && data.error === 'QUOTA_EXCEEDED') {
        setQuotaExceeded(true);
        setIsSubmitting(false);
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        return;
      }

      if (data.error === 'ABNORMAL_ACTIVITY') {
        setErrorMessage(t.upload.abnormalActivityError);
        setIsSubmitting(false);
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || t.upload.errorGeneric);
      }
      
      // Clean up previews
      clearAllFiles();
      
      if (data.alreadyExists) {
        setToastNotification({
          message: t.upload.alreadyExistsToast,
          type: 'info',
        });
        setTimeout(() => {
          router.push(`/library/${data.tutorialId}`);
        }, 1200);
        return;
      }

      // Navigate to newly created interactive pattern project
      router.push(`/library/${data.tutorialId}`);
    } catch (err: any) {
      setErrorMessage(err.message || t.upload.errorGeneric);
      setIsSubmitting(false);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
    }
  };

  return (
    <div className="w-full">
      {/* Floating Dynamic Toast (Error, Info, Success) */}
      <Toast
        message={toastNotification?.message || errorMessage}
        type={toastNotification?.type || 'error'}
        onClose={() => {
          setErrorMessage(null);
          setToastNotification(null);
        }}
      />

      {/* Quota Exceeded Banner (if triggered at submit time) */}
      {quotaExceeded && (
        <div className="mb-8 p-6 rounded-3xl bg-rose-50 border border-rose-200 shadow-soft animate-fadeIn">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-3 flex-1">
              <h3 className="text-base font-bold font-serif text-rose-950">
                {t.upload.quotaWarningTitle}
              </h3>
              <p className="text-sm text-yarn-700 leading-relaxed">
                {t.upload.quotaWarningDesc}
              </p>
              <Link
                href="/#tarifs"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-sage-800 hover:bg-sage-900 shadow-soft transition-all"
              >
                <span>{t.upload.upgradeCta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* TAB SELECTOR: File vs Raw Text */}
        <div className="flex items-center p-1.5 rounded-2xl bg-yarn-100/90 border border-yarn-200 shadow-inner">
          <button
            type="button"
            disabled={isBlocked || isSubmitting}
            onClick={() => {
              setActiveTab('file');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'file'
                ? 'bg-white text-yarn-950 shadow-soft'
                : 'text-yarn-600 hover:text-yarn-900'
            } ${isBlocked || isSubmitting ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <FileText className="w-4 h-4 text-sage-600" />
            <span>{t.upload.tabFiles}</span>
          </button>

          <button
            type="button"
            disabled={isBlocked || isSubmitting}
            onClick={() => {
              setActiveTab('text');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'text'
                ? 'bg-white text-yarn-950 shadow-soft'
                : 'text-yarn-600 hover:text-yarn-900'
            } ${isBlocked || isSubmitting ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <AlignLeft className="w-4 h-4 text-sage-600" />
            <span>{t.upload.tabText}</span>
          </button>
        </div>

        {/* TAB 1: FILE UPLOAD DROPZONE */}
        {activeTab === 'file' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              disabled={isBlocked || isSubmitting}
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="relative">
              {/* Quota Blocked Overlay on Dropzone */}
              {isBlocked && (
                <div className="absolute inset-0 z-20 rounded-3xl bg-white/95 backdrop-blur-sm border-2 border-dashed border-yarn-300 flex flex-col items-center justify-center p-6 text-center space-y-3 shadow-soft">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center shadow-xs">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h4 className="text-sm sm:text-base font-bold font-serif text-yarn-950">
                      {t.upload.quotaWarningTitle}
                    </h4>
                    <p className="text-xs text-yarn-600 leading-relaxed">
                      {t.upload.quotaBlockedDropzone}
                    </p>
                  </div>
                  <Link
                    href="/#tarifs"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-sage-800 hover:bg-sage-900 shadow-soft transition-all hover:scale-105 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{t.upload.upgradeCta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              <div
                onDragOver={isBlocked || isSubmitting ? undefined : handleDragOver}
                onDragLeave={isBlocked || isSubmitting ? undefined : handleDragLeave}
                onDrop={isBlocked || isSubmitting ? undefined : handleDrop}
                onClick={isBlocked || isSubmitting ? undefined : () => fileInputRef.current?.click()}
                className={`p-8 sm:p-12 rounded-3xl border-2 border-dashed text-center transition-all ${
                  isBlocked || isSubmitting
                    ? 'border-yarn-300 bg-yarn-50/40 opacity-40 cursor-not-allowed'
                    : isDragging
                    ? 'border-sage-600 bg-sage-50/70 scale-[1.01] cursor-pointer'
                    : 'border-yarn-300 bg-white hover:border-sage-500 hover:bg-yarn-50/50 shadow-soft cursor-pointer'
                }`}
              >
                <div className="w-16 h-16 rounded-3xl bg-sage-100 text-sage-700 flex items-center justify-center mx-auto mb-4">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-base sm:text-lg font-bold font-serif text-yarn-900 mb-1">
                  {t.upload.dropzoneTitle}
                </h3>
                <p className="text-xs sm:text-sm text-yarn-600 mb-4 max-w-md mx-auto">
                  {t.upload.dropzoneSubtitle}
                </p>
                <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold ${
                  isBlocked || isSubmitting
                    ? 'bg-yarn-200 text-yarn-500 cursor-not-allowed'
                    : 'bg-yarn-100 text-yarn-800 hover:bg-yarn-200 transition-colors'
                }`}>
                  {t.upload.dropzoneBrowse}
                </span>
              </div>
            </div>

            {/* Selected files preview list */}
            {selectedFiles.length > 0 && !isBlocked && (
              <div className="p-4 rounded-2xl bg-white border border-yarn-200 shadow-soft space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-yarn-700 pb-2 border-b border-yarn-100">
                  <span>
                    {t.upload.selectedFiles} ({selectedFiles.length})
                  </span>
                  {!isSubmitting && (
                    <button
                      type="button"
                      onClick={clearAllFiles}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      {t.upload.clearFiles}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedFiles.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-yarn-50 border border-yarn-200 text-xs relative group"
                    >
                      {item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="w-10 h-10 object-cover rounded-lg border border-yarn-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-yarn-200 text-yarn-700 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-yarn-900 truncate">{item.file.name}</p>
                        <p className="text-[11px] text-yarn-500 font-mono">
                          {Math.round(item.file.size / 1024)} KB
                        </p>
                      </div>

                      {!isSubmitting && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          className="p-1 rounded-md text-yarn-400 hover:text-red-600 hover:bg-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {!isSubmitting && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 text-center text-xs font-semibold text-sage-700 hover:text-sage-800 transition-colors"
                  >
                    {t.upload.addMoreFiles}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RAW TEXT INPUT */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs sm:text-sm font-bold text-yarn-900">
                {t.upload.textLabel}
              </label>
            </div>

            <textarea
              rows={9}
              value={rawText}
              disabled={isBlocked || isSubmitting}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={isBlocked ? t.upload.quotaBlockedDropzone : t.upload.textPlaceholder}
              className={`w-full p-4 rounded-2xl border bg-white text-sm font-mono text-yarn-900 shadow-soft focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                isBlocked || isSubmitting
                  ? 'border-yarn-300 bg-yarn-50 text-yarn-400 cursor-not-allowed opacity-60'
                  : 'border-yarn-300 placeholder:text-yarn-400'
              }`}
            />
            <p className="text-[11px] text-yarn-500">{t.upload.textHint}</p>
          </div>
        )}

        {/* OPTIONAL PROJECT DETAILS */}
        <div className="p-6 rounded-3xl bg-white border border-yarn-200 shadow-soft space-y-4">
          <h4 className="text-sm font-bold font-serif text-yarn-900">
            {t.upload.detailsTitle}
          </h4>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-yarn-700">
              {t.upload.patternTitleLabel}
            </label>
            <input
              type="text"
              value={customTitle}
              disabled={isBlocked || isSubmitting}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={t.upload.patternTitlePlaceholder}
              className={`w-full px-4 py-2.5 rounded-xl border border-yarn-200 bg-yarn-50 text-sm text-yarn-900 focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                isBlocked || isSubmitting ? 'opacity-60 cursor-not-allowed' : 'placeholder:text-yarn-400'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-yarn-700">
              {t.upload.patternNoteLabel}
            </label>
            <textarea
              rows={2}
              value={customNote}
              disabled={isBlocked || isSubmitting}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder={t.upload.patternNotePlaceholder}
              className={`w-full p-3 rounded-xl border border-yarn-200 bg-yarn-50 text-sm text-yarn-900 focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                isBlocked || isSubmitting ? 'opacity-60 cursor-not-allowed' : 'placeholder:text-yarn-400'
              }`}
            />
          </div>
        </div>

        {/* SUBMIT BUTTON & PROGRESS */}
        <div className="space-y-4 pt-2" ref={submitSectionRef}>
          {/* Animated step progression while submitting */}
          {isSubmitting && (
            <div className="p-6 rounded-3xl bg-sage-50/90 border border-sage-200 text-yarn-800 space-y-3.5 shadow-soft animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3 text-xs font-semibold">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStepIndex > 0
                      ? 'bg-emerald-600 text-white'
                      : currentStepIndex === 0
                      ? 'bg-sage-700 text-white animate-pulse'
                      : 'bg-yarn-300 text-yarn-700'
                  }`}
                >
                  {currentStepIndex > 0 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                </div>
                <span className={currentStepIndex === 0 ? 'font-bold text-yarn-950 text-sm' : 'text-yarn-600'}>
                  {t.upload.step1}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStepIndex > 1
                      ? 'bg-emerald-600 text-white'
                      : currentStepIndex === 1
                      ? 'bg-sage-700 text-white animate-pulse'
                      : 'bg-yarn-300 text-yarn-700'
                  }`}
                >
                  {currentStepIndex > 1 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                </div>
                <span className={currentStepIndex === 1 ? 'font-bold text-yarn-950 text-sm' : 'text-yarn-600'}>
                  {t.upload.step2}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStepIndex >= 2
                      ? 'bg-sage-700 text-white animate-spin'
                      : 'bg-yarn-300 text-yarn-700'
                  }`}
                >
                  {currentStepIndex >= 2 ? <Loader2 className="w-3.5 h-3.5" /> : '3'}
                </div>
                <span className={currentStepIndex >= 2 ? 'font-bold text-yarn-950 text-sm' : 'text-yarn-600'}>
                  {t.upload.step3}
                </span>
              </div>

              {/* Patience / Loading Notice */}
              <div className="pt-3 border-t border-sage-200/80 flex items-start gap-2.5 text-xs text-sage-900 bg-sage-100/70 p-3 rounded-2xl">
                <Clock className="w-4 h-4 text-sage-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-normal">
                  {t.upload.patientNotice}
                </p>
              </div>
            </div>
          )}

          {/* Submit Button or Upgrade Button when Blocked */}
          {isBlocked ? (
            <Link
              href="/#tarifs"
              className="w-full py-4 px-6 rounded-2xl text-base font-bold text-white bg-sage-800 hover:bg-sage-900 shadow-soft flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
            >
              <Lock className="w-5 h-5 text-emerald-300" />
              <span>{t.upload.quotaBlockedButton}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-6 rounded-2xl text-base font-bold text-white shadow-lift flex items-center justify-center gap-2 transition-all transform ${
                isSubmitting
                  ? 'bg-yarn-400 cursor-not-allowed opacity-90'
                  : 'bg-gradient-to-r from-sage-800 via-sage-700 to-sage-600 hover:from-sage-900 hover:to-sage-700 hover:-translate-y-0.5 shadow-soft hover:shadow-lift'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t.upload.submitting}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>{t.upload.submitButton}</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
