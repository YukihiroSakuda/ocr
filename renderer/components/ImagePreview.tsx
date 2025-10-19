'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ZoomIn, ZoomOut, Wand2 } from 'lucide-react';
import type { SourceImage } from '@/store/app-store';
import { Spinner } from './common/Spinner';

interface ImagePreviewProps {
  image: SourceImage | null;
  processedImage: string | null;
  isProcessing: boolean;
  statusMessage: string;
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.1;

export const ImagePreview = ({ image, processedImage, isProcessing, statusMessage }: ImagePreviewProps) => {
  const [zoom, setZoom] = useState(1);
  const [showProcessed, setShowProcessed] = useState(false);

  const displayImage = useMemo(() => {
    if (showProcessed && processedImage) {
      return processedImage;
    }
    return image?.dataUrl ?? null;
  }, [image?.dataUrl, processedImage, showProcessed]);

  const dimensions = useMemo(() => {
    if (image?.width && image?.height) {
      return { width: image.width, height: image.height };
    }
    return { width: 1280, height: 720 };
  }, [image?.height, image?.width]);

  const handleZoom = (delta: number) => {
    setZoom((prev) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
      return Number(next.toFixed(2));
    });
  };

  const resetZoom = () => setZoom(1);

  return (
    <div className="flex h-full min-h-[260px] w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white text-sm dark:border-gray-700 dark:bg-gray-800 md:min-h-0">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-1.5 text-gray-600 dark:border-gray-700 dark:text-gray-300">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Input Image</span>
        <div className="flex items-center gap-2">
          {processedImage && (
            <button
              type="button"
              onClick={() => setShowProcessed((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 transition hover:border-gray-400 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-500"
              aria-pressed={showProcessed}
            >
              <Wand2 size={14} />
              {showProcessed ? 'Processed' : 'Original'}
            </button>
          )}
          <div className="flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-gray-600 dark:border-gray-600 dark:text-gray-200">
            <button type="button" onClick={() => handleZoom(-ZOOM_STEP)} aria-label="ズームアウト">
              <ZoomOut size={14} />
            </button>
            <span className="w-10 text-center text-xs font-medium">{(zoom * 100).toFixed(0)}%</span>
            <button type="button" onClick={() => handleZoom(ZOOM_STEP)} aria-label="ズームイン">
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              リセット
            </button>
          </div>
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center bg-gray-100 dark:bg-gray-900">
        {displayImage ? (
          <div className="h-full w-full overflow-auto">
            <div
              className="mx-auto inline-block origin-top transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            >
              <Image
                src={displayImage}
                alt="OCR対象画像"
                width={Math.max(dimensions.width, 1)}
                height={Math.max(dimensions.height, 1)}
                unoptimized
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>No image loaded yet.</p>
            <p>Use the buttons below to select an image.</p>
          </div>
        )}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 text-gray-600 dark:bg-gray-900/70 dark:text-gray-200">
            <Spinner size={28} />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
