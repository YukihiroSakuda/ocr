"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut, Wand2, X } from "lucide-react";
import type { SourceImage } from "@/store/app-store";
import { Spinner } from "./common/Spinner";

interface ImagePreviewProps {
  image: SourceImage | null;
  processedImage: string | null;
  isProcessing: boolean;
  statusMessage: string;
  onClear: () => void;
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.1;

export const ImagePreview = ({
  image,
  processedImage,
  isProcessing,
  statusMessage,
  onClear,
}: ImagePreviewProps) => {
  const [zoom, setZoom] = useState(1);
  const [showProcessed, setShowProcessed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow left-click (button 0) for dragging
    if (e.button !== 0 || !scrollContainerRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    scrollContainerRef.current.style.cursor = 'grabbing';
    scrollContainerRef.current.style.userSelect = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    scrollContainerRef.current.scrollLeft -= e.movementX;
    scrollContainerRef.current.scrollTop -= e.movementY;
  };

  const handleMouseUp = () => {
    if (!scrollContainerRef.current) return;
    setIsDragging(false);
    scrollContainerRef.current.style.cursor = 'grab';
    scrollContainerRef.current.style.userSelect = '';
  };

  const handleMouseLeave = () => {
    if (!scrollContainerRef.current) return;
    setIsDragging(false);
    scrollContainerRef.current.style.cursor = 'grab';
    scrollContainerRef.current.style.userSelect = '';
  };

  // Add global mouseup listener to ensure dragging stops even if mouse is released outside the container
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging && scrollContainerRef.current) {
        setIsDragging(false);
        scrollContainerRef.current.style.cursor = 'grab';
        scrollContainerRef.current.style.userSelect = '';
      }
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] text-sm text-[var(--text-primary)] backdrop-blur-xl"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="flex min-h-[56px] flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-2 text-[var(--text-secondary)]">
        <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-secondary)]">
          Input Image
        </span>
        <div className="flex items-center gap-2">
          {processedImage && (
            <button
              type="button"
              onClick={() => setShowProcessed((prev) => !prev)}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--control-border)] bg-[var(--control-surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:bg-[var(--control-surface-hover)] hover:text-[var(--text-primary)]"
              aria-pressed={showProcessed}
            >
              <Wand2 size={16} />
              {showProcessed ? "Processed" : "Original"}
            </button>
          )}
          <div className="flex items-center gap-2 rounded-xl border border-[var(--input-border)] bg-[var(--input-surface)] px-3 py-1 text-[var(--text-secondary)]">
            <button
              type="button"
              onClick={() => handleZoom(-ZOOM_STEP)}
              aria-label="Zoom out"
              className="rounded-lg border border-[var(--control-border)] bg-[var(--control-surface)] p-1.5 transition hover:bg-[var(--control-surface-hover)] hover:text-[var(--text-primary)]"
            >
              <ZoomOut size={16} />
            </button>
            <span className="w-12 text-center text-xs font-semibold tracking-wide text-[var(--text-primary)]">
              {(zoom * 100).toFixed(0)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(ZOOM_STEP)}
              aria-label="Zoom in"
              className="rounded-lg border border-[var(--control-border)] bg-[var(--control-surface)] p-1.5 transition hover:bg-[var(--control-surface-hover)] hover:text-[var(--text-primary)]"
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              Reset
            </button>
          </div>
          {image && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--control-border)] bg-[var(--control-surface)] text-[var(--text-secondary)] transition hover:bg-[var(--control-surface-hover)] hover:text-[var(--text-primary)]"
              title="Clear image and result"
            >
              <X size={18} />
              <span className="sr-only">Clear</span>
            </button>
          )}
        </div>
      </div>
      <div className="relative flex flex-1 overflow-hidden bg-[var(--background-muted)]/70 md:p-2">
        {displayImage ? (
          <div
            ref={scrollContainerRef}
            className="h-full w-full overflow-auto"
            style={{ cursor: 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="mx-auto inline-block origin-top transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            >
              <Image
                src={displayImage}
                alt="OCR target image"
                width={Math.max(dimensions.width, 1)}
                height={Math.max(dimensions.height, 1)}
                unoptimized
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-1 p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <p>NO IMAGE AVAILABLE.</p>
            <p>PRESS &quot;CLIPBOARD&quot; OR &quot;SELECT FILE&quot; TO LOAD ONE.</p>
          </div>
        )}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--background)]/75 text-[var(--text-primary)] backdrop-blur-sm">
            <Spinner size={28} />
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              {statusMessage}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
