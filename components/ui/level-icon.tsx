import React from 'react';
import { Sprout, Flame, Crown, Layers } from 'lucide-react';

export interface LevelStyle {
  badgeClass: string;
  iconColor: string;
  activeBg: string;
}

const normalizeLevelStr = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export function getLevelStyle(level?: string | null): LevelStyle {
  if (!level) {
    return {
      badgeClass: 'bg-yarn-100 text-yarn-800 border-yarn-200/80',
      iconColor: 'text-yarn-600',
      activeBg: 'bg-yarn-100',
    };
  }

  const norm = normalizeLevelStr(level);

  if (norm.includes('debut') || norm.includes('begin') || norm.includes('facil') || norm.includes('easy')) {
    return {
      badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200/80 shadow-2xs',
      iconColor: 'text-emerald-600',
      activeBg: 'bg-emerald-100',
    };
  }

  if (norm.includes('intermed') || norm.includes('moyen') || norm.includes('medium')) {
    return {
      badgeClass: 'bg-amber-50 text-amber-900 border-amber-200/80 shadow-2xs',
      iconColor: 'text-amber-600',
      activeBg: 'bg-amber-100',
    };
  }

  if (norm.includes('avanc') || norm.includes('advan') || norm.includes('expert') || norm.includes('diffic') || norm.includes('hard')) {
    return {
      badgeClass: 'bg-purple-50 text-purple-900 border-purple-200/80 shadow-2xs',
      iconColor: 'text-purple-600',
      activeBg: 'bg-purple-100',
    };
  }

  return {
    badgeClass: 'bg-yarn-100 text-yarn-800 border-yarn-200/80 shadow-2xs',
    iconColor: 'text-yarn-600',
    activeBg: 'bg-yarn-100',
  };
}

interface LevelIconProps {
  level?: string | null;
  className?: string;
}

export function LevelIcon({ level, className = 'w-3.5 h-3.5' }: LevelIconProps) {
  if (!level) return <Layers className={className} />;
  const norm = normalizeLevelStr(level);

  if (norm.includes('debut') || norm.includes('begin') || norm.includes('facil') || norm.includes('easy')) {
    return <Sprout className={className} />;
  }

  if (norm.includes('intermed') || norm.includes('moyen') || norm.includes('medium')) {
    return <Flame className={className} />;
  }

  if (norm.includes('avanc') || norm.includes('advan') || norm.includes('expert') || norm.includes('diffic') || norm.includes('hard')) {
    return <Crown className={className} />;
  }

  return <Layers className={className} />;
}

interface LevelBadgeProps {
  level?: string | null;
  label?: string | null;
  className?: string;
}

export function LevelBadge({ level, label, className = '' }: LevelBadgeProps) {
  if (!level && !label) return null;
  const style = getLevelStyle(level);
  const displayLabel = label || level || '';

  return (
    <span
      className={`h-6 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border shadow-2xs shrink-0 ${style.badgeClass} ${className}`}
    >
      <LevelIcon level={level} className={`w-3 h-3 ${style.iconColor} shrink-0`} />
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}
