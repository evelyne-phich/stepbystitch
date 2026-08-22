'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Upload,
  RotateCcw,
  Trash2,
  ChevronDown,
  Check,
  Loader2,
  Edit2,
  ImageIcon,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { CategoryIcon, CraftVignette, getCategoryStyle } from '@/components/ui/category-icon';
import { LevelIcon, getLevelStyle } from '@/components/ui/level-icon';
import { PdfThumbnail } from '@/components/ui/pdf-thumbnail';
import {
  updateTutorialDetails,
  updateTutorialCoverImage,
  deleteTutorialCoverImage,
  resetTutorialCoverToOriginal,
} from '@/app/(dashboard)/library/[id]/actions';

export interface EditProjectModalSavedData {
  title: string;
  note: string | null;
  level: string | null;
  project_type: string | null;
  coverImageUrl: string | null;
  coverPdfUrl?: string | null;
  originalDocUrl?: string | null;
  isOriginalPdf?: boolean;
  cover_image_path?: string | null;
  hasCustomCover?: boolean;
}

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutorialId: string;
  initialTitle: string;
  initialNote: string | null;
  initialLevel: string | null;
  initialProjectType: string | null;
  initialCoverImageUrl: string | null;
  hasCustomCover?: boolean;
  hasOriginalDoc?: boolean;
  coverPdfUrl?: string | null;
  originalDocUrl?: string | null;
  isOriginalPdf?: boolean;
  targetLanguage?: string;
  onSaved: (data: EditProjectModalSavedData) => void;
}

export function EditProjectModal({
  isOpen,
  onClose,
  tutorialId,
  initialTitle,
  initialNote,
  initialLevel,
  initialProjectType,
  initialCoverImageUrl,
  hasCustomCover = false,
  hasOriginalDoc = false,
  coverPdfUrl = null,
  originalDocUrl = null,
  isOriginalPdf = false,
  targetLanguage = 'original',
  onSaved,
}: EditProjectModalProps) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  // Form input buffer
  const [editTitle, setEditTitle] = useState(initialTitle);
  const [editNote, setEditNote] = useState(initialNote || '');
  const [editLevel, setEditLevel] = useState(initialLevel || '');
  const [editProjectType, setEditProjectType] = useState(initialProjectType || '');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);

  // Cover Image buffer
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(initialCoverImageUrl);
  const [isCoverDeleted, setIsCoverDeleted] = useState(false);
  const [isCoverRestored, setIsCoverRestored] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const levelDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const EDIT_CATEGORY_OPTIONS = [
    { key: 'amigurumi', label: (t.project.projectTypes as any)?.amigurumi || 'Amigurumi' },
    { key: 'clothing', label: (t.project.projectTypes as any)?.clothing || 'Vêtement' },
    { key: 'accessories', label: (t.project.projectTypes as any)?.accessories || 'Accessoire' },
    { key: 'blanket', label: (t.project.projectTypes as any)?.blanket || 'Plaid & Couverture' },
    { key: 'home', label: (t.project.projectTypes as any)?.home || 'Maison & Déco' },
    { key: 'other', label: (t.project.projectTypes as any)?.other || 'Autre' },
  ] as const;

  const EDIT_LEVEL_OPTIONS = [
    { key: 'beginner', label: (t.project.levels as any)?.beginner || 'Débutant' },
    { key: 'intermediate', label: (t.project.levels as any)?.intermediate || 'Intermédiaire' },
    { key: 'advanced', label: (t.project.levels as any)?.advanced || 'Avancé' },
  ] as const;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync inputs whenever modal opens or props update
  useEffect(() => {
    if (isOpen) {
      setEditTitle(initialTitle);
      setEditNote(initialNote || '');
      setEditLevel(initialLevel || '');
      setEditProjectType(initialProjectType || '');
      setEditCoverFile(null);
      setEditCoverPreview(initialCoverImageUrl);
      setIsCoverDeleted(false);
      setIsCoverRestored(false);
      setShowCategoryDropdown(false);
      setShowLevelDropdown(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialTitle, initialNote, initialLevel, initialProjectType, initialCoverImageUrl]);

  // Click outside dropdowns listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(target)) {
        setShowCategoryDropdown(false);
      }
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(target)) {
        setShowLevelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setIsSaving(true);
    try {
      let updatedCoverImageUrl = editCoverPreview;
      let updatedCoverPdfUrl = coverPdfUrl;
      let updatedCoverPath: string | null = initialCoverImageUrl ? 'existing' : null;
      let updatedHasCustomCover = hasCustomCover;

      // Handle Cover Image updates
      if (isCoverDeleted) {
        const res = await deleteTutorialCoverImage(tutorialId);
        if (res.success) {
          updatedCoverImageUrl = null;
          updatedCoverPdfUrl = null;
          updatedCoverPath = null;
          updatedHasCustomCover = false;
        }
      } else if (isCoverRestored) {
        const res = await resetTutorialCoverToOriginal(tutorialId);
        if (res.success) {
          updatedCoverImageUrl = res.coverImageUrl;
          updatedCoverPdfUrl = res.coverPdfUrl;
          updatedCoverPath = null;
          updatedHasCustomCover = false;
        }
      } else if (editCoverFile) {
        const formData = new FormData();
        formData.append('coverImage', editCoverFile);
        const res = await updateTutorialCoverImage(tutorialId, formData);
        if (res?.success && res.coverImageUrl) {
          updatedCoverImageUrl = res.coverImageUrl;
          updatedCoverPdfUrl = null;
          updatedCoverPath = 'updated';
          updatedHasCustomCover = true;
        }
      }

      // Handle Details update
      await updateTutorialDetails(tutorialId, {
        title: editTitle.trim(),
        note: editNote.trim() || null,
        level: editLevel.trim() || null,
        project_type: editProjectType.trim() || null,
        targetLanguage,
      });

      onSaved({
        title: editTitle.trim(),
        note: editNote.trim() || null,
        level: editLevel.trim() || null,
        project_type: editProjectType.trim() || null,
        coverImageUrl: updatedCoverImageUrl,
        coverPdfUrl: updatedCoverPdfUrl,
        originalDocUrl,
        isOriginalPdf,
        cover_image_path: updatedCoverPath,
        hasCustomCover: updatedHasCustomCover,
      });

      onClose();
    } catch (err) {
      console.error('Failed to save project details:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Compute original document and restore capability
  const effectivePdfUrl = coverPdfUrl || (isOriginalPdf ? originalDocUrl : null);
  const hasOriginal = Boolean(hasOriginalDoc || effectivePdfUrl || originalDocUrl);
  const isCurrentlyOriginal =
    !isCoverDeleted &&
    (isCoverRestored ||
      (!hasCustomCover &&
        !editCoverFile &&
        (coverPdfUrl ? true : Boolean(editCoverPreview && editCoverPreview === originalDocUrl))));
  const canRestoreOriginal = hasOriginal && !isCurrentlyOriginal;

  const handleRestoreOriginal = () => {
    setIsCoverRestored(true);
    setIsCoverDeleted(false);
    setEditCoverFile(null);
    if (isOriginalPdf || effectivePdfUrl) {
      setEditCoverPreview(null);
    } else {
      setEditCoverPreview(originalDocUrl || initialCoverImageUrl || null);
    }
  };

  // Check if preview should render an image, a PDF thumbnail, or empty dropzone
  const hasImagePreview = Boolean(editCoverFile || (editCoverPreview && !isCoverDeleted));
  const hasPdfPreview = Boolean(
    !isCoverDeleted &&
    (isCoverRestored
      ? Boolean(isOriginalPdf && originalDocUrl)
      : Boolean(coverPdfUrl && !hasCustomCover && !editCoverFile && !editCoverPreview))
  );
  const isDisplayingVisual = (hasImagePreview || hasPdfPreview) && !isCoverDeleted;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-yarn-950/65 backdrop-blur-xs animate-in fade-in transition-opacity"
      />

      {/* Responsive Drawer on mobile / Centered Modal on desktop */}
      <div
        className="relative w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] bg-white rounded-t-[28px] sm:rounded-3xl border-t sm:border border-yarn-200 shadow-2xl overflow-hidden flex flex-col z-10 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal / Drawer Header */}
        <div className="p-4 sm:p-6 border-b border-yarn-100 bg-gradient-to-br from-yarn-50 via-white to-sage-50/40 shrink-0">
          {/* Mobile Handle Bar */}
          <div className="w-10 h-1 rounded-full bg-yarn-300 mx-auto mb-3 sm:hidden shrink-0" />

          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-sage-100 text-sage-800 flex items-center justify-center shadow-2xs shrink-0">
                <Edit2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-yarn-950 font-serif truncate">
                  {t.project.editDetailsTitle}
                </h3>
                <p className="text-[11px] text-yarn-500 hidden sm:block truncate">
                  {t.project.editDetailsDesc}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-xl hover:bg-yarn-200/60 text-yarn-500 hover:text-yarn-800 transition-colors flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <form id="edit-project-modal-form" onSubmit={handleSave} className="space-y-4">
            {/* Cover Image Upload / Preview Zone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-yarn-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-sage-700" />
                  <span>{t.project.coverImageLabel}</span>
                </span>
                <span className="text-[10px] text-yarn-400 font-normal">{t.project.coverImageHelp}</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setEditCoverFile(file);
                    setIsCoverDeleted(false);
                    setIsCoverRestored(false);
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setEditCoverPreview(ev.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />

              {isDisplayingVisual ? (
                <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-yarn-900/10 border border-yarn-200 group flex items-center justify-center shadow-2xs">
                  {hasPdfPreview ? (
                    <div className="w-full h-full relative">
                      <PdfThumbnail
                        pdfUrl={(isCoverRestored ? originalDocUrl : effectivePdfUrl)!}
                        alt="Aperçu couverture"
                        fallback={<CraftVignette category={editProjectType} title={editTitle} />}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Ambient blurred backdrop */}
                      <img
                        src={editCoverPreview!}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover filter blur-md scale-110 opacity-30 pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

                      {/* Crisp uncropped preview */}
                      <img
                        src={editCoverPreview!}
                        alt="Aperçu couverture"
                        className="relative z-10 w-full h-full object-contain p-2"
                      />
                    </>
                  )}

                  {/* Iconic Vertical Action Button Toolbar on Top-Right */}
                  <div className="absolute top-2.5 right-2.5 z-20 flex flex-col items-center gap-1.5 opacity-95 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {/* 1. Change Cover Image */}
                    <button
                      type="button"
                      title={t.project.changeCoverImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 w-8 rounded-xl bg-white/95 hover:bg-white text-sage-700 hover:text-sage-800 border border-sage-200/90 shadow-2xs flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    >
                      <Upload className="w-3.5 h-3.5 text-sage-700" />
                    </button>

                    {/* 2. Restore Original Cover (Only if not currently original) */}
                    {canRestoreOriginal && (
                      <button
                        type="button"
                        title={t.project.restoreOriginalCover}
                        onClick={handleRestoreOriginal}
                        className="h-8 w-8 rounded-xl bg-white/95 hover:bg-white text-yarn-800 hover:text-yarn-950 border border-yarn-200/90 shadow-2xs flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-sage-700" />
                      </button>
                    )}

                    {/* 3. Remove / Delete Cover Image */}
                    <button
                      type="button"
                      title={t.project.removeCoverImage}
                      onClick={() => {
                        setEditCoverFile(null);
                        setEditCoverPreview(null);
                        setIsCoverDeleted(true);
                        setIsCoverRestored(false);
                      }}
                      className="h-8 w-8 rounded-xl bg-white/95 hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200/90 shadow-2xs flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                        setEditCoverFile(file);
                        setIsCoverDeleted(false);
                        setIsCoverRestored(false);
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setEditCoverPreview(ev.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full h-28 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1.5 p-3 text-center cursor-pointer group relative overflow-hidden ${
                      isDragOver
                        ? 'border-sage-600 bg-sage-50/90 text-sage-900 shadow-soft'
                        : 'border-yarn-300/90 hover:border-sage-500 bg-gradient-to-br from-yarn-100/70 via-sage-50/50 to-yarn-200/50 hover:bg-sage-50/50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-2xl bg-white border border-yarn-200/90 flex items-center justify-center text-sage-700 group-hover:scale-110 shadow-2xs transition-all">
                      <Upload className="w-4 h-4 text-sage-700" />
                    </div>
                    <div className="space-y-0.5 pointer-events-none">
                      <span className="text-xs font-bold text-yarn-800 group-hover:text-sage-900 block">
                        {t.project.uploadCoverImage}
                      </span>
                      <span className="text-[10px] text-yarn-500 group-hover:text-sage-700 font-medium block">
                        {t.library.dragDropCoverOrBrowse}
                      </span>
                    </div>
                  </button>

                  {canRestoreOriginal && (
                    <button
                      type="button"
                      onClick={handleRestoreOriginal}
                      className="w-full py-2 px-3 rounded-xl bg-yarn-100/70 hover:bg-yarn-200/80 text-yarn-700 hover:text-yarn-900 text-xs font-semibold border border-yarn-200/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-sage-700" />
                      <span>{t.project.restoreOriginalCover}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-yarn-900">
                {t.project.titleLabel} *
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-yarn-300 bg-white text-sm text-yarn-900 focus:outline-none focus:ring-2 focus:ring-sage-500 shadow-2xs font-semibold"
              />
            </div>

            {/* Description / Personal Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-yarn-900">
                {t.project.descriptionLabel}
              </label>
              <textarea
                rows={3}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder={t.project.descriptionPlaceholder}
                className="w-full p-3.5 rounded-xl border border-yarn-300 bg-white text-sm text-yarn-900 focus:outline-none focus:ring-2 focus:ring-sage-500 shadow-2xs placeholder:text-yarn-400 resize-none"
              />
            </div>

            {/* Category & Level Dropdowns (50/50 side-by-side on mobile and desktop) */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
              {/* Category Dropdown */}
              <div ref={categoryDropdownRef} className="space-y-1.5 relative">
                <label className="text-xs font-bold text-yarn-900 flex items-center gap-1.5">
                  <CategoryIcon
                    category={editProjectType}
                    className={`w-3.5 h-3.5 ${editProjectType ? getCategoryStyle(editProjectType).iconColor : 'text-sage-700'}`}
                  />
                  <span>{t.project.categoryLabel}</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLevelDropdown(false);
                      setShowCategoryDropdown((prev) => !prev);
                    }}
                    className={`w-full inline-flex items-center justify-between gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all shadow-2xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                      editProjectType
                        ? `${getCategoryStyle(editProjectType).badgeClass} shadow-xs`
                        : 'bg-white text-yarn-800 hover:bg-yarn-50 border-yarn-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <CategoryIcon
                        category={editProjectType}
                        className={`w-3.5 h-3.5 shrink-0 ${editProjectType ? getCategoryStyle(editProjectType).iconColor : 'text-sage-700'}`}
                      />
                      <span className="truncate">
                        {!editProjectType
                          ? (t.library.filterCategoryAll || 'Non spécifié')
                          : (t.project.projectTypes as any)?.[editProjectType.toLowerCase()] || editProjectType}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-yarn-500 shrink-0 ml-1" />
                  </button>

                  {showCategoryDropdown && (
                    <div className="absolute left-0 bottom-full mb-1.5 w-full rounded-2xl bg-white border border-yarn-200 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="space-y-0.5 max-h-56 overflow-y-auto">
                        {EDIT_CATEGORY_OPTIONS.map((opt) => {
                          const isSelected = (editProjectType || '').toLowerCase() === opt.key.toLowerCase();
                          const optStyle = getCategoryStyle(opt.key);
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => {
                                setEditProjectType(opt.key);
                                setShowCategoryDropdown(false);
                              }}
                              className={`w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected ? `font-bold text-yarn-950 ${optStyle.activeBg}` : 'text-yarn-800 hover:bg-yarn-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <CategoryIcon
                                  category={opt.key}
                                  className={`w-3.5 h-3.5 shrink-0 ${optStyle.iconColor}`}
                                />
                                <span className="truncate">{opt.label}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-sage-700 shrink-0 ml-1.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Level Dropdown */}
              <div ref={levelDropdownRef} className="space-y-1.5 relative">
                <label className="text-xs font-bold text-yarn-900 flex items-center gap-1.5">
                  <LevelIcon
                    level={editLevel}
                    className={`w-3.5 h-3.5 ${editLevel ? getLevelStyle(editLevel).iconColor : 'text-sage-700'}`}
                  />
                  <span>{t.project.levelLabel}</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCategoryDropdown(false);
                      setShowLevelDropdown((prev) => !prev);
                    }}
                    className={`w-full inline-flex items-center justify-between gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all shadow-2xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                      editLevel
                        ? `${getLevelStyle(editLevel).badgeClass} shadow-xs`
                        : 'bg-white text-yarn-800 hover:bg-yarn-50 border-yarn-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <LevelIcon
                        level={editLevel}
                        className={`w-3.5 h-3.5 shrink-0 ${editLevel ? getLevelStyle(editLevel).iconColor : 'text-sage-700'}`}
                      />
                      <span className="truncate">
                        {!editLevel
                          ? (t.library.allLevels || 'Tous les niveaux')
                          : (t.project.levels as any)?.[editLevel.toLowerCase()] || editLevel}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-yarn-500 shrink-0 ml-1" />
                  </button>

                  {showLevelDropdown && (
                    <div className="absolute left-0 bottom-full mb-1.5 w-full rounded-2xl bg-white border border-yarn-200 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="space-y-0.5 max-h-56 overflow-y-auto">
                        {EDIT_LEVEL_OPTIONS.map((opt) => {
                          const isSelected = (editLevel || '').toLowerCase() === opt.key.toLowerCase();
                          const optStyle = getLevelStyle(opt.key);
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => {
                                setEditLevel(opt.key);
                                setShowLevelDropdown(false);
                              }}
                              className={`w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected ? `font-bold text-yarn-950 ${optStyle.activeBg}` : 'text-yarn-800 hover:bg-yarn-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <LevelIcon
                                  level={opt.key}
                                  className={`w-3.5 h-3.5 shrink-0 ${optStyle.iconColor}`}
                                />
                                <span className="truncate">{opt.label}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-sage-700 shrink-0 ml-1.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-yarn-100 bg-yarn-50/50 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-yarn-700 hover:bg-yarn-100 border border-yarn-200 transition-colors cursor-pointer"
          >
            {t.project.cancelEdit}
          </button>
          <button
            type="submit"
            form="edit-project-modal-form"
            disabled={isSaving || !editTitle.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-sage-800 hover:bg-sage-900 disabled:opacity-50 transition-all shadow-soft cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t.project.savingDetails}</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t.project.saveDetails}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
