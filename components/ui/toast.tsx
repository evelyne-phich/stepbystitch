'use client';

import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'info';

export interface ToastProps {
  message: string | null;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = 'error',
  onClose,
  duration = 6000,
}: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bgStyles = {
    error: 'bg-red-950/90 border-red-500/80 text-white shadow-lift',
    success: 'bg-emerald-950/90 border-emerald-500/80 text-white shadow-lift',
    info: 'bg-yarn-950/90 border-sage-500/80 text-white shadow-lift',
  }[type];

  const icon = {
    error: <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-sage-400 flex-shrink-0" />,
  }[type];

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[92vw] sm:w-auto animate-in slide-in-from-top-6 fade-in duration-300">
      <div
        className={`flex items-start gap-3.5 px-4 py-3.5 rounded-2xl border backdrop-blur-md ${bgStyles}`}
      >
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
          {message}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 -mr-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
