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
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <section className="relative z-10 w-full max-w-3xl rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 text-sm text-[var(--text-primary)] shadow-2xl backdrop-blur-2xl">
        <header className="mb-4 space-y-1">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Language Preferences
          </h2>
          <p
            className={`text-xs transition ${
              selection.length
                ? "text-[var(--control-surface)]"
                : "text-[var(--text-muted)]"
            }`}
          >
            Select all languages you need for OCR.
          </p>
        </header>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = selection.includes(option.code);
              return (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => toggleLanguage(option.code)}
                  aria-pressed={isSelected}
                  className={`rounded-2xl border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                    isSelected
                      ? "border-[var(--control-border)] bg-[var(--accent-soft)] text-[var(--surface-raised)] shadow-[0_0_0_1px_rgba(56,189,248,0.35)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--control-border)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            {selectedLabels.length ? selectedLabels.join(", ") : "No languages selected."}
          </div>
        </div>

        <footer className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--control-border)] bg-[var(--control-surface)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:bg-[var(--control-surface-hover)] hover:text-[var(--text-primary)]"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selection.length || isSaving}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--control-border)] bg-[var(--control-surface)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-primary)] transition hover:bg-[var(--control-surface-hover)] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-transparent disabled:text-[var(--control-disabled)]"
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Saving...
              </>
            ) : (
              <>
                <Check size={14} />
                Save
              </>
            )}
          </button>
        </footer>
      </section>
    </div>
  );
};










