"use client";

import { useEffect, useState } from "react";
import {
  LANGUAGE_OPTIONS,
  formatLanguageSelection,
  getLanguageLabels,
  parseLanguageString,
} from "@/lib/languages";
import { Check, Loader2, X } from "lucide-react";

interface LanguageOverlayProps {
  open: boolean;
  currentLanguage: string | null;
  onClose: () => void;
  onSave: (languageString: string) => void | Promise<void>;
}

export const LanguageOverlay = ({
  open,
  currentLanguage,
  onClose,
  onSave,
}: LanguageOverlayProps) => {
  const [selection, setSelection] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setSelection(parseLanguageString(currentLanguage));
    } else {
      document.body.style.overflow = "";
    }
    setIsSaving(false);
    return () => {
      document.body.style.overflow = "";
    };
  }, [currentLanguage, open]);

  if (!open) return null;

  const toggleLanguage = (code: string) => {
    setSelection((previous) => {
      if (previous.includes(code)) {
        return previous.filter((item) => item !== code);
      }
      return [...previous, code];
    });
  };

  const handleSave = async () => {
    if (!selection.length || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(formatLanguageSelection(selection));
    } finally {
      setIsSaving(false);
    }
  };

  const selectedLabels = getLanguageLabels(selection);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <section className="relative z-10 w-full max-w-3xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 text-sm text-[var(--text-primary)]" style={{ boxShadow: 'var(--glow)' }}>
        <header className="mb-5 border-b border-[var(--border)] pb-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--text-tertiary)]">
            OCR LANGUAGE CONFIG
          </p>
          <h2 className="text-lg font-mono font-bold tracking-tight text-[var(--accent-base)]">
            &gt; SELECT_LANGUAGES
          </h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
            {selection.length ? `${selection.length} SELECTED` : "NO SELECTION"}
          </p>
        </header>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = selection.includes(option.code);
              return (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => toggleLanguage(option.code)}
                  aria-pressed={isSelected}
                  className={`border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide transition ${
                    isSelected
                      ? "border-[var(--accent-base)] bg-[var(--accent-base)]/10 text-[var(--accent-base)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-base)] hover:text-[var(--accent-base)]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="border border-[var(--border)] bg-[var(--input-surface)] px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
            {selectedLabels.length ? selectedLabels.join(" / ") : "[ NONE ]"}
          </div>
        </div>

        <footer className="mt-6 flex items-center justify-end gap-2 border-t border-[var(--border)] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 border border-[var(--control-border)] bg-[var(--control-surface)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:border-[var(--accent-base)] hover:bg-[var(--control-surface-hover)] hover:text-[var(--accent-base)]"
          >
            <X size={12} />
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selection.length || isSaving}
            className="inline-flex items-center gap-1.5 border border-[var(--control-border)] bg-[var(--control-surface)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-base)] transition hover:border-[var(--accent-base)] hover:bg-[var(--control-surface-hover)] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-transparent disabled:text-[var(--control-disabled)]"
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={12} />
                SAVING
              </>
            ) : (
              <>
                <Check size={12} />
                SAVE
              </>
            )}
          </button>
        </footer>
      </section>
    </div>
  );
};










