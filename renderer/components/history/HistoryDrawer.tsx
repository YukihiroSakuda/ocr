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
      <aside className="relative ml-auto flex h-full w-full max-w-sm flex-col border-l border-gray-200 bg-white text-sm dark:border-gray-700 dark:bg-gray-900">
        <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div>
            <h2 className="text-base font-semibold">OCR History</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Stores up to 200 recent results.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-200"
            >
              <Trash2 size={14} />
              Clear All
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 p-1 text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-300"
              aria-label="Close history"
            >
              <X size={16} />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {isLoading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No history yet.</p>
          ) : (
            <ul className="space-y-3">
              {history.map((entry) => (
                <li key={entry.id} className="rounded-md border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => onSelect(entry)}
                      className="flex flex-col gap-2 px-3 py-2 text-left"
                    >
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={12} />
                          {formatDate(entry.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FileText size={12} />
                          Confidence {entry.confidence ? Math.round(entry.confidence) : '--'}%
                        </span>
                      </div>
                      <p className="line-clamp-3 text-sm text-gray-700 dark:text-gray-200">{entry.textResult}</p>
                    </button>
                    <div className="flex items-center justify-between border-t border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      <span>{entry.lang}</span>
                      <button
                        type="button"
                        onClick={() => onDelete(entry.id)}
                        className="rounded border border-transparent px-2 py-1 hover:border-red-400 hover:text-red-500 dark:hover:border-red-700 dark:hover:text-red-400"
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
        <footer className="border-t border-gray-200 px-4 py-3 text-right text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {history.length} saved entries
        </footer>
      </aside>
    </div>
  );
};
