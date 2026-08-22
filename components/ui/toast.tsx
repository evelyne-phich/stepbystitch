'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, Loader2, X } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'info';

export interface ToastProps {
  message: string | null;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
  isLoading?: boolean;
}

export function Toast({
  message,
  type = 'success',
  onClose,
  duration = 6000,
  isLoading = false,
}: ToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!message || isLoading) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose, isLoading]);

  if (!message || !mounted) return null;

  const bgStyles = {
    error: 'bg-rose-950 text-white border-rose-800 shadow-lift',
    success: 'bg-yarn-950 text-white border-yarn-700 shadow-lift',
    info: 'bg-yarn-950 text-white border-yarn-700 shadow-lift',
  }[type];

  const icon = isLoading ? (
    <Loader2 className="w-4 h-4 text-sage-300 animate-spin shrink-0" />
  ) : (
    {
      error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
      success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
      info: <Info className="w-4 h-4 text-sage-300 shrink-0" />,
    }[type]
  );

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-[92vw] sm:w-auto animate-in slide-in-from-bottom-5 fade-in duration-200 pointer-events-auto">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl ${bgStyles}`}
      >
        <div className="shrink-0">{icon}</div>
        <div className="flex-1 text-xs font-bold leading-snug">
          {message}
        </div>
        {!isLoading && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 -mr-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
