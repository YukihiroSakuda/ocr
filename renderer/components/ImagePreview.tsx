"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut, Wand2 } from "lucide-react";
import type { SourceImage } from "@/store/app-store";
import { Spinner } from "./common/Spinner";

interface ImagePreviewProps {
  image: SourceImage | null;
  processedImage: string | null;
  isProcessing: boolean;
  statusMessage: string;
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.1;

export const ImagePreview = ({
  image,
  processedImage,
  isProcessing,
  statusMessage,
}: ImagePreviewProps) => {
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
    <div
      className="flex h-full min-h-[320px] w-full flex-col overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] text-sm text-[var(--text-primary)] backdrop-blur-xl md:min-h-[420px]"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="flex min-h-[48px] items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 text-[var(--text-secondary)]">
        <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-secondary)]">
          Input Feed
        </span>
        <div className="flex items-center gap-2">
          {processedImage && (
            <button
              type="button"
              onClick={() => setShowProcessed((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--control-border)] bg-[var(--control-surface)] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:bg-[var(--control-surface-hover)] hover:text-[var(--text-primary)]"
              aria-pressed={showProcessed}
            >
              <Wand2 size={16} />
              {showProcessed ? "Processed" : "Original"}
            </button>
          )}
          <div className="flex items-center gap-2 rounded-xl border border-[var(--input-border)] bg-[var(--input-surface)] px-3 py-2 text-[var(--text-secondary)]">
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
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center bg-[var(--background-muted)]/70 md:p-2">
        {displayImage ? (
          <div className="h-full w-full overflow-auto">
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
          <div className="flex flex-col items-center gap-1 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <p>No visual source linked.</p>
            <p>Deploy the controls below to ingest an image.</p>
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
