'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PdfPageNavigatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isProcessing: boolean;
}

export function PdfPageNavigator({
  currentPage,
  totalPages,
  onPageChange,
  isProcessing
}: PdfPageNavigatorProps) {
  const canGoPrevious = currentPage > 1 && !isProcessing;
  const canGoNext = currentPage < totalPages && !isProcessing;

  return (
    <div className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-1.5 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious}
        title="Previous page"
        className="inline-flex items-center justify-center rounded border border-[var(--control-border)] bg-[var(--control-surface)] p-1 text-[var(--text-primary)] transition hover:bg-[var(--control-surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={14} />
      </button>

      <div className="flex items-center gap-1 text-xs whitespace-nowrap">
        <span className="font-semibold text-[var(--text-primary)]">
          {currentPage}
        </span>
        <span className="text-[var(--text-secondary)]">/ {totalPages}</span>
      </div>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        title="Next page"
        className="inline-flex items-center justify-center rounded border border-[var(--control-border)] bg-[var(--control-surface)] p-1 text-[var(--text-primary)] transition hover:bg-[var(--control-surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
