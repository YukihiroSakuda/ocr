"use client";

import { useEffect } from "react";
import type { AppSettings } from "@/types/desktop";

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings | null;
  onUpdate: (patch: Partial<AppSettings>) => void;
}

const ToggleRow = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <label className="group flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-sm text-[var(--text-primary)] shadow-[0_18px_40px_-26px_rgba(15,23,42,0.65)] transition hover:border-[var(--control-border)] hover:bg-[var(--surface-raised)]">
    <span className="flex flex-col">
      <span className="text-sm font-semibold tracking-wide">{label}</span>
      {description ? (
        <span className="text-xs text-[var(--text-muted)]">{description}</span>
      ) : null}
    </span>
    <span className="relative inline-flex h-6 w-11 items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
      <span className="absolute inset-0 rounded-full bg-[var(--border)] transition peer-checked:bg-sky-500/50 peer-hover:bg-[var(--control-border)]" />
      <span className="absolute left-1 h-4 w-4 rounded-full bg-[var(--surface-raised)] shadow-[0_6px_15px_rgba(15,23,42,0.35)] transition peer-checked:translate-x-5 peer-checked:bg-white" />
    </span>
  </label>
);

export const SettingsSheet = ({
  open,
  onClose,
  settings,
  onUpdate,
}: SettingsSheetProps) => {
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
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <section className="relative ml-auto flex h-full w-full max-w-xl flex-col border-l border-[var(--border-strong)] bg-[var(--surface-raised)] text-sm text-[var(--text-primary)] shadow-[0_35px_65px_-30px_rgba(8,11,24,0.65)] backdrop-blur-2xl">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-soft)]">
              System preferences
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              Control Center
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Tune automation and normalization preferences.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--control-border)] bg-[var(--control-surface)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--control-surface-hover)] hover:text-[var(--text-primary)]"
            aria-label="Close settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 [scrollbar-width:thin]">
          {!settings ? (
            <p className="text-[var(--text-secondary)]">Loading settings...</p>
          ) : (
            <>
              <ToggleRow
                label="Auto copy after OCR"
                description="Write captured text to the clipboard after processing."
                checked={settings.autoCopy}
                onChange={(value) => onUpdate({ autoCopy: value })}
              />
              <ToggleRow
                label="OCR clipboard on launch"
                description="Automatically process clipboard image data when the app opens."
                checked={settings.autoProcessClipboard}
                onChange={(value) => onUpdate({ autoProcessClipboard: value })}
              />
              <ToggleRow
                label="Trim whitespace"
                description="Remove leading and trailing whitespace characters."
                checked={settings.textNormalization.trimWhitespace}
                onChange={(value) =>
                  onUpdate({
                    textNormalization: {
                      ...settings.textNormalization,
                      trimWhitespace: value,
                    },
                  })
                }
              />
              <ToggleRow
                label="Collapse whitespace"
                description="Convert repeating spaces into a single space."
                checked={settings.textNormalization.collapseWhitespace}
                onChange={(value) =>
                  onUpdate({
                    textNormalization: {
                      ...settings.textNormalization,
                      collapseWhitespace: value,
                    },
                  })
                }
              />
              <ToggleRow
                label="Flatten line breaks"
                description="Replace newline characters with single spaces."
                checked={settings.textNormalization.removeLineBreaks}
                onChange={(value) =>
                  onUpdate({
                    textNormalization: {
                      ...settings.textNormalization,
                      removeLineBreaks: value,
                    },
                  })
                }
              />

              <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.55)]">
                <label className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["system", "light", "dark"] as const).map((mode) => {
                    const isActive = settings.theme === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onUpdate({ theme: mode })}
                        className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                          isActive
                            ? "border-[var(--control-border)] bg-[var(--control-surface)] text-[var(--text-primary)] shadow-[0_10px_20px_-18px_rgba(56,189,248,0.6)]"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--control-border)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
