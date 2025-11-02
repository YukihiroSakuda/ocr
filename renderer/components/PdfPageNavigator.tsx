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
    <div className="flex items-center justify-center gap-1.5 border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-1">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious}
        title="Previous page"
        className="inline-flex items-center justify-center border border-[var(--control-border)] bg-[var(--control-surface)] p-0.5 text-[var(--text-primary)] transition hover:border-[var(--accent-base)] hover:bg-[var(--control-surface-hover)] hover:text-[var(--accent-base)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={12} />
      </button>

      <div className="flex items-center gap-1 text-[10px] whitespace-nowrap font-mono">
        <span className="font-semibold text-[var(--accent-base)]">
          {currentPage}
        </span>
        <span className="text-[var(--text-tertiary)]">/{totalPages}</span>
      </div>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        title="Next page"
        className="inline-flex items-center justify-center border border-[var(--control-border)] bg-[var(--control-surface)] p-0.5 text-[var(--text-primary)] transition hover:border-[var(--accent-base)] hover:bg-[var(--control-surface-hover)] hover:text-[var(--accent-base)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight size={12} />
      </button>
    </div>
  );
}
