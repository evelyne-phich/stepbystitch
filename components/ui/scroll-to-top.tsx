'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface ScrollToTopProps {
  /**
   * The scroll threshold in pixels after which the button becomes visible.
   * @default 350
   */
  threshold?: number;
}

export function ScrollToTop({ threshold = 350 }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const handleScroll = () => {
      const isScrollable = document.documentElement.scrollHeight > window.innerHeight + 150;
      if (isScrollable && window.scrollY > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Check immediately on mount
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      title={t.common.scrollToTop}
      aria-label={t.common.scrollToTop}
      className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-40 h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-white/95 backdrop-blur-md border border-yarn-200 shadow-soft hover:shadow-md hover:bg-yarn-100 text-yarn-700 hover:text-yarn-950 transition-all duration-300 ease-out cursor-pointer flex items-center justify-center animate-in fade-in zoom-in-95"
    >
      <ArrowUp className="w-5 h-5 text-sage-700" />
    </button>
  );
}
