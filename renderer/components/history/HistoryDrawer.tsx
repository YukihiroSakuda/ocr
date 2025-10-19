'use client';

import { useEffect } from 'react';
import { Clock3, FileText, Trash2, X } from 'lucide-react';
import type { HistoryEntry } from '@/types/desktop';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: number) => void;
  onClear: () => void;
  isLoading: boolean;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export const HistoryDrawer = ({
  open,
  onClose,
  history,
  onSelect,
  onDelete,
  onClear,
  isLoading
}: HistoryDrawerProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <aside className="relative ml-auto flex h-full w-full max-w-xl flex-col border-l border-[var(--border-strong)] bg-[var(--surface-raised)] text-sm text-[var(--text-primary)] shadow-[0_35px_65px_-30px_rgba(8,11,24,0.65)] backdrop-blur-2xl">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-soft)]">Timeline</p>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">OCR History</h2>
            <p className="text-xs text-[var(--text-muted)]">Stores up to 200 recent captures for quick recall.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--control-border)] bg-[var(--control-surface)] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:bg-[var(--control-surface-hover)] hover:text-[var(--text-primary)]"
            >
              <Trash2 size={14} />
              Clear All
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--control-border)] bg-[var(--control-surface)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--control-surface-hover)] hover:text-[var(--text-primary)]"
              aria-label="Close history"
            >
              <X size={16} />
            </button>
          </div>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 [scrollbar-width:thin]">
          {isLoading ? (
            <p className="text-[var(--text-secondary)]">Loading history...</p>
          ) : history.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] shadow-[0_18px_40px_-26px_rgba(15,23,42,0.55)]">
              No entries captured yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_18px_40px_-26px_rgba(15,23,42,0.55)] transition hover:border-[var(--control-border)]"
                >
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => onSelect(entry)}
                      className="flex flex-col gap-2 px-4 py-3 text-left"
                    >
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={12} />
                          {formatDate(entry.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FileText size={12} />
                          Confidence {entry.confidence ? Math.round(entry.confidence) : "--"}%
                        </span>
                      </div>
                      <p className="line-clamp-3 text-sm text-[var(--text-primary)]">{entry.textResult}</p>
                    </button>
                    <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--text-secondary)]">
                      <span className="uppercase tracking-[0.18em] text-[var(--text-muted)]">{entry.lang}</span>
                      <button
                        type="button"
                        onClick={() => onDelete(entry.id)}
                        className="rounded-lg border border-transparent px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:border-red-500/50 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="border-t border-[var(--border)] px-6 py-4 text-right text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {history.length} saved entries
        </footer>
      </aside>
    </div>
  );
};
