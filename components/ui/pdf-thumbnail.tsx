'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface PdfThumbnailProps {
  pdfUrl: string;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}

// Global in-memory cache for rendered PDF first-page thumbnails
const pdfThumbnailCache = new Map<string, string>();

function getPdfCacheKey(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch {
    return url.split('?')[0];
  }
}

export function PdfThumbnail({
  pdfUrl,
  alt = 'Aperçu du patron PDF',
  className = '',
  fallback = null,
}: PdfThumbnailProps) {
  const cacheKey = getPdfCacheKey(pdfUrl);
  const cachedDataUrl = pdfThumbnailCache.get(cacheKey);

  const [thumbDataUrl, setThumbDataUrl] = useState<string | null>(cachedDataUrl || null);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedDataUrl);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const currentKey = getPdfCacheKey(pdfUrl);

    if (pdfThumbnailCache.has(currentKey)) {
      setThumbDataUrl(pdfThumbnailCache.get(currentKey)!);
      setIsLoading(false);
      return;
    }

    async function loadPdfFirstPage() {
      try {
        setIsLoading(true);
        setHasError(false);

        // Dynamically import pdfjs-dist in the browser
        const pdfjs = await import('pdfjs-dist');
        
        // Use CDN worker matching installed version
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

        const loadingTask = pdfjs.getDocument({
          url: pdfUrl,
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
          cMapPacked: true,
        });

        const pdfDoc = await loadingTask.promise;
        const firstPage = await pdfDoc.getPage(1);

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Canvas 2D context unavailable');
        }

        // Scale to 1.25 for crisp thumbnail quality
        const viewport = firstPage.getViewport({ scale: 1.25 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await firstPage.render({
          canvasContext: context,
          viewport,
        }).promise;

        if (!isCancelled) {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          pdfThumbnailCache.set(currentKey, dataUrl);
          setThumbDataUrl(dataUrl);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('[PdfThumbnail] Could not render first page of PDF:', err);
        if (!isCancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    }

    if (pdfUrl) {
      loadPdfFirstPage();
    }

    return () => {
      isCancelled = true;
    };
  }, [pdfUrl]);

  if (isLoading) {
    return (
      <div className={`w-full h-full bg-yarn-100/80 flex items-center justify-center ${className}`}>
        <Loader2 className="w-5 h-5 text-sage-600 animate-spin opacity-75" />
      </div>
    );
  }

  if (hasError || !thumbDataUrl) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-yarn-900/10">
      {/* Ambient blurred background */}
      <img
        src={thumbDataUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-110 opacity-50 pointer-events-none"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      {/* Crisp uncropped PDF page thumbnail */}
      <img
        src={thumbDataUrl}
        alt={alt}
        className={`relative z-10 w-full h-full object-contain p-1.5 shadow-xs rounded-lg ${className}`}
        loading="lazy"
      />
    </div>
  );
}
