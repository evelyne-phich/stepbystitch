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

export function CategoryBadge({ category, label, className = '' }: CategoryBadgeProps) {
  if (!category && !label) return null;
  const style = getCategoryStyle(category);
  const displayLabel = label || category || '';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${style.badgeClass} ${className}`}
    >
      <CategoryIcon category={category} className={`w-3 h-3 ${style.iconColor} shrink-0`} />
      <span>{displayLabel}</span>
    </span>
  );
}
