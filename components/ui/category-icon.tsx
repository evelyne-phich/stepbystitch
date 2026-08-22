import React from 'react';
import { Sparkles, ShoppingBag, Shirt, Grid, Home, Bookmark, Tag } from 'lucide-react';

export interface CategoryStyle {
  badgeClass: string;
  iconColor: string;
  activeBg: string;
}

export function getCategoryStyle(category?: string | null): CategoryStyle {
  if (!category) {
    return {
      badgeClass: 'bg-yarn-100 text-yarn-800 border-yarn-200/80',
      iconColor: 'text-yarn-600',
      activeBg: 'bg-yarn-100',
    };
  }

  const norm = category.toLowerCase().trim();

  switch (norm) {
    case 'amigurumi':
      return {
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-200/80 shadow-2xs',
        iconColor: 'text-purple-600',
        activeBg: 'bg-purple-100',
      };
    case 'accessory':
      return {
        badgeClass: 'bg-amber-50 text-amber-900 border-amber-200/80 shadow-2xs',
        iconColor: 'text-amber-600',
        activeBg: 'bg-amber-100',
      };
    case 'garment':
    case 'clothing':
      return {
        badgeClass: 'bg-sky-50 text-sky-900 border-sky-200/80 shadow-2xs',
        iconColor: 'text-sky-600',
        activeBg: 'bg-sky-100',
      };
    case 'blanket':
      return {
        badgeClass: 'bg-rose-50 text-rose-900 border-rose-200/80 shadow-2xs',
        iconColor: 'text-rose-600',
        activeBg: 'bg-rose-100',
      };
    case 'home':
    case 'decoration':
      return {
        badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200/80 shadow-2xs',
        iconColor: 'text-emerald-600',
        activeBg: 'bg-emerald-100',
      };
    case 'other':
      return {
        badgeClass: 'bg-yarn-100 text-yarn-800 border-yarn-200/80 shadow-2xs',
        iconColor: 'text-yarn-600',
        activeBg: 'bg-yarn-200',
      };
    default:
      return {
        badgeClass: 'bg-yarn-100 text-yarn-800 border-yarn-200/80 shadow-2xs',
        iconColor: 'text-yarn-600',
        activeBg: 'bg-yarn-100',
      };
  }
}

interface CategoryIconProps {
  category?: string | null;
  className?: string;
}

export function CategoryIcon({ category, className = 'w-3.5 h-3.5' }: CategoryIconProps) {
  if (!category) return <Tag className={className} />;
  const norm = category.toLowerCase().trim();

  switch (norm) {
    case 'amigurumi':
      return <Sparkles className={className} />;
    case 'accessory':
      return <ShoppingBag className={className} />;
    case 'garment':
    case 'clothing':
      return <Shirt className={className} />;
    case 'blanket':
      return <Grid className={className} />;
    case 'home':
    case 'decoration':
      return <Home className={className} />;
    case 'other':
      return <Bookmark className={className} />;
    default:
      return <Tag className={className} />;
  }
}

interface CategoryBadgeProps {
  category?: string | null;
  label?: string | null;
  className?: string;
}

export function getCategoryGradient(category?: string | null): string {
  if (!category) return 'from-[#FAF6F0] via-[#F5EEE6] to-[#ECE3D6]';
  const norm = category.toLowerCase().trim();
  switch (norm) {
    case 'amigurumi':
      return 'from-purple-100/95 via-pink-50/90 to-purple-200/80';
    case 'accessory':
    case 'accessories':
      return 'from-amber-100/95 via-orange-50/90 to-amber-200/80';
    case 'garment':
    case 'clothing':
      return 'from-sky-100/95 via-indigo-50/90 to-sky-200/80';
    case 'blanket':
      return 'from-rose-100/95 via-pink-50/90 to-rose-200/80';
    case 'home':
    case 'decoration':
      return 'from-emerald-100/95 via-teal-50/90 to-emerald-200/80';
    default:
      return 'from-yarn-100/95 via-sage-50/90 to-yarn-200/80';
  }
}

export function CraftVignette({
  category,
  title,
  className = '',
}: {
  category?: string | null;
  title?: string;
  className?: string;
}) {
  const gradient = getCategoryGradient(category);
  const style = getCategoryStyle(category);

  return (
    <div
      className={`w-full h-full bg-gradient-to-br ${gradient} p-4 flex flex-col items-center justify-center relative overflow-hidden select-none ${className}`}
    >
      {/* Decorative craft circles */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border-4 border-white/40 pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 w-36 h-36 rounded-full border-4 border-white/30 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#00000008_1px,transparent_1px)] [background-size:12px_12px] opacity-60 pointer-events-none" />

      {/* Tactile central artisan badge */}
      <div className="relative z-10 flex flex-col items-center gap-2 group-hover:scale-105 transition-transform duration-300">
        <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl sm:rounded-3xl bg-white/95 border border-white/90 shadow-lift flex items-center justify-center backdrop-blur-xs">
          <CategoryIcon category={category} className={`w-6 h-6 sm:w-7 sm:h-7 ${style.iconColor}`} />
        </div>
        {title && (
          <span className="text-[11px] sm:text-xs font-serif font-bold text-yarn-900/90 line-clamp-1 max-w-[180px] text-center px-2.5 py-0.5 rounded-full bg-white/80 backdrop-blur-2xs border border-white/70 shadow-2xs">
            {title}
          </span>
        )}
      </div>
    </div>
  );
}

export function CategoryBadge({ category, label, className = '' }: CategoryBadgeProps) {
  if (!category && !label) return null;
  const style = getCategoryStyle(category);
  const displayLabel = label || category || '';

  return (
    <span
      className={`h-6 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border shadow-2xs shrink-0 ${style.badgeClass} ${className}`}
    >
      <CategoryIcon category={category} className={`w-3 h-3 ${style.iconColor} shrink-0`} />
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}
