"use client";

import { useEffect } from "react";
import { Clock3, FileText, Trash2, X } from "lucide-react";
import type { HistoryEntry } from "@/types/desktop";

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
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

export const HistoryDrawer = ({
  open,
  onClose,
  history,
  onSelect,
  onDelete,
  onClear,
  isLoading,
}: HistoryDrawerProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="relative ml-auto flex h-full w-full max-w-xl flex-col border-l border-[var(--border-strong)] bg-[var(--surface-raised)] text-sm text-[var(--text-primary)]"
        style={{ boxShadow: "var(--glow)" }}
      >
        <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--text-tertiary)]">
              ARCHIVE
            </p>
            <h2 className="font-mono text-lg font-bold tracking-tight text-[var(--accent-base)]">
              &gt; HISTORY
            </h2>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-[var(--text-secondary)]">
              MAX 200 ENTRIES
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 border border-[var(--control-border)] bg-[var(--control-surface)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:border-[var(--accent-base)] hover:bg-[var(--control-surface-hover)] hover:text-[var(--accent-base)]"
            >
              <Trash2 size={12} />
              DELETE ALL
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-[var(--control-border)] bg-[var(--control-surface)] p-1.5 text-[var(--text-secondary)] transition hover:border-[var(--accent-base)] hover:bg-[var(--control-surface-hover)] hover:text-[var(--accent-base)]"
              aria-label="Close history"
            >
              <X size={14} />
            </button>
          </div>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5 [scrollbar-width:thin]">
          {isLoading ? (
            <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
              LOADING...
            </p>
          ) : history.length === 0 ? (
            <div className="border border-[var(--border)] bg-[var(--surface)] px-4 py-6 font-mono text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
              [ NO ENTRIES ]
            </div>
          ) : (
            <ul className="space-y-2">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="border border-[var(--border)] bg-[var(--surface)] transition hover:border-[var(--accent-base)]"
                >
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => onSelect(entry)}
                      className="flex flex-col gap-2 px-4 py-3 text-left"
                    >
                      <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wide text-[var(--text-tertiary)]">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={10} />
                          {formatDate(entry.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FileText size={10} />
                          CONF{" "}
                          {entry.confidence
                            ? Math.round(entry.confidence)
                            : "--"}
                          %
                        </span>
                      </div>
                      <p className="line-clamp-3 text-sm text-[var(--text-primary)]">
                        {entry.textResult}
                      </p>
                    </button>
                    <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--text-secondary)]">
                      <span className="font-mono text-[9px] uppercase tracking-wide text-[var(--text-tertiary)]">
                        {entry.lang}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDelete(entry.id)}
                        className="border border-transparent px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:border-red-500/50 hover:text-red-400"
                      >
                        DEL
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="border-t border-[var(--border)] px-6 py-3 text-right font-mono text-[9px] uppercase tracking-wide text-[var(--text-tertiary)]">
          {history.length} / 200 ENTRIES
        </footer>
      </aside>
    </div>
  );
};
