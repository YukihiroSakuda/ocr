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
  <label className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] shadow-sm">
    <span className="flex flex-col">
      <span className="font-medium">{label}</span>
      {description ? (
        <span className="text-xs text-[var(--text-muted)]">{description}</span>
      ) : null}
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 accent-[var(--accent-soft)]"
    />
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
      <section className="relative ml-auto flex h-full w-full max-w-lg flex-col border-l border-[var(--border-strong)] bg-[var(--surface)] text-sm text-[var(--text-primary)] shadow-2xl backdrop-blur-2xl">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Control Center</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Tune automation and normalization preferences.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--control-border)] bg-[var(--control-surface)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:bg-[var(--control-surface-hover)] hover:text-[var(--text-primary)]"
          >
            Close
          </button>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {!settings ? (
            <p className="text-[var(--text-secondary)]">Loading settings…</p>
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  History limit
                </label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={settings.maxHistoryItems}
                  onChange={(event) => {
                    const next = Number.parseInt(event.target.value, 10);
                    onUpdate({
                      maxHistoryItems: Number.isNaN(next)
                        ? settings.maxHistoryItems
                        : next,
                    });
                  }}
                  className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--control-border)] focus:ring-2 focus:ring-sky-400/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
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
                            ? "border-[var(--control-border)] bg-[var(--control-surface)] text-[var(--text-primary)]"
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
