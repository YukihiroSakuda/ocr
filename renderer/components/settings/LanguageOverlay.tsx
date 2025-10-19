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
      <section className="relative z-10 w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 text-sm shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <header className="mb-4 space-y-1">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Language Preferences
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
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
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
                      : "border border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {selectedLabels.length ? selectedLabels.join(", ") : "No languages selected."}
          </div>
        </div>

        <footer className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 transition hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-200"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selection.length || isSaving}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition enabled:hover:bg-blue-500 disabled:opacity-60 dark:bg-blue-500 dark:enabled:hover:bg-blue-400"
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










