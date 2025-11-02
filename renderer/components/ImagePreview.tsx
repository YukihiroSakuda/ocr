"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut, Wand2, X } from "lucide-react";
import type { SourceImage } from "@/store/app-store";
import { PdfPageNavigator } from "./PdfPageNavigator";

interface ImagePreviewProps {
  image: SourceImage | null;
  processedImage: string | null;
  isProcessing: boolean;
  statusMessage: string;
  onClear: () => void;
  onPageChange?: (page: number) => void;
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
  onPageChange,
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
      className="flex h-full min-h-0 w-full flex-col overflow-hidden border border-[var(--border-strong)] bg-[var(--surface)] text-sm text-[var(--text-primary)]"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="flex min-h-[48px] flex-nowrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-[var(--text-secondary)] overflow-x-auto">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-[var(--text-tertiary)]">
            INPUT_IMG
          </span>
          {image?.origin === 'pdf' && image.currentPage && image.totalPages && onPageChange && (
            <PdfPageNavigator
              currentPage={image.currentPage}
              totalPages={image.totalPages}
              onPageChange={onPageChange}
              isProcessing={isProcessing}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {processedImage && (
            <button
              type="button"
              onClick={() => setShowProcessed((prev) => !prev)}
              className="inline-flex items-center gap-1.5 border border-[var(--control-border)] bg-[var(--control-surface)] px-2.5 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:border-[var(--accent-base)] hover:bg-[var(--control-surface-hover)] hover:text-[var(--accent-base)]"
              aria-pressed={showProcessed}
            >
              <Wand2 size={14} />
              {showProcessed ? "PROC" : "ORIG"}
            </button>
          )}
          <div className="flex items-center gap-1.5 border border-[var(--input-border)] bg-[var(--input-surface)] px-2 py-1 text-[var(--text-secondary)]">
            <button
              type="button"
              onClick={() => handleZoom(-ZOOM_STEP)}
              aria-label="Zoom out"
              className="border border-[var(--control-border)] bg-[var(--control-surface)] p-1 transition hover:border-[var(--accent-base)] hover:bg-[var(--control-surface-hover)] hover:text-[var(--accent-base)]"
            >
              <ZoomOut size={14} />
            </button>
            <span className="w-10 text-center text-[10px] font-mono font-semibold tracking-wide text-[var(--text-primary)]">
              {(zoom * 100).toFixed(0)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(ZOOM_STEP)}
              aria-label="Zoom in"
              className="border border-[var(--control-border)] bg-[var(--control-surface)] p-1 transition hover:border-[var(--accent-base)] hover:bg-[var(--control-surface-hover)] hover:text-[var(--accent-base)]"
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              className="text-[10px] font-mono font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:text-[var(--accent-base)]"
            >
              RST
            </button>
          </div>
          {image && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center justify-center border border-[var(--control-border)] bg-[var(--control-surface)] p-1.5 text-[var(--text-secondary)] transition hover:border-[var(--accent-base)] hover:bg-[var(--control-surface-hover)] hover:text-[var(--accent-base)]"
              title="Clear image and result"
            >
              <X size={16} />
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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 text-[var(--text-primary)] backdrop-blur-sm">
            {/* Simple animated grid */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(90deg, transparent 49%, rgba(0, 255, 255, 0.1) 50%, transparent 51%), linear-gradient(0deg, transparent 49%, rgba(0, 255, 255, 0.1) 50%, transparent 51%)',
                backgroundSize: '60px 60px',
                animation: 'moveGrid 30s linear infinite'
              }}></div>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6">
              <span className="font-mono text-2xl font-bold uppercase tracking-wider text-white">
                {statusMessage}
              </span>
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-[var(--accent-pink)]" style={{ animation: 'fadeIn 0.6s ease-in-out infinite' }}></div>
                <div className="h-4 w-4 rounded-full bg-[var(--accent-pink)]" style={{ animation: 'fadeIn 0.6s ease-in-out 0.2s infinite' }}></div>
                <div className="h-4 w-4 rounded-full bg-[var(--accent-pink)]" style={{ animation: 'fadeIn 0.6s ease-in-out 0.4s infinite' }}></div>
                <div className="h-4 w-4 rounded-full bg-[var(--accent-pink)]" style={{ animation: 'fadeIn 0.6s ease-in-out 0.6s infinite' }}></div>
                <div className="h-4 w-4 rounded-full bg-[var(--accent-pink)]" style={{ animation: 'fadeIn 0.6s ease-in-out 0.8s infinite' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
