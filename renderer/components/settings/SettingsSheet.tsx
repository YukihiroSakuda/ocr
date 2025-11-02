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
  <label className="group flex items-center justify-between gap-4 border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] transition hover:border-[var(--accent-base)] hover:bg-[var(--surface-raised)]">
    <span className="flex flex-col gap-1">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">{label}</span>
      {description ? (
        <span className="font-mono text-[9px] uppercase tracking-wide text-[var(--text-tertiary)]">{description}</span>
      ) : null}
    </span>
    <span className="relative inline-flex h-5 w-10 items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
      <span className="absolute inset-0 border border-[var(--text-tertiary)] bg-[var(--background-muted)] transition peer-checked:border-[var(--accent-base)] peer-checked:bg-[var(--accent-base)]/20 peer-hover:border-[var(--accent-base)]" />
      <span className="absolute left-0.5 h-4 w-4 border border-[var(--text-tertiary)] bg-[var(--text-tertiary)] transition peer-checked:translate-x-5 peer-checked:border-[var(--accent-base)] peer-checked:bg-[var(--accent-base)]" />
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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <section className="relative ml-auto flex h-full w-full max-w-xl flex-col border-l border-[var(--border-strong)] bg-[var(--surface-raised)] text-sm text-[var(--text-primary)]" style={{ boxShadow: 'var(--glow)' }}>
        <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--text-tertiary)]">
              SYSTEM CONFIG
            </p>
            <h2 className="font-mono text-lg font-bold tracking-tight text-[var(--accent-base)]">
              &gt; SETTINGS
            </h2>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-[var(--text-secondary)]">
              AUTOMATION / NORMALIZATION
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-[var(--control-border)] bg-[var(--control-surface)] p-1.5 text-[var(--text-secondary)] transition hover:border-[var(--accent-base)] hover:bg-[var(--control-surface-hover)] hover:text-[var(--accent-base)]"
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
        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5 [scrollbar-width:thin]">
          {!settings ? (
            <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">LOADING...</p>
          ) : (
            <>
              <ToggleRow
                label="Auto Copy After OCR"
                description="Write text to clipboard"
                checked={settings.autoCopy}
                onChange={(value) => onUpdate({ autoCopy: value })}
              />
              <ToggleRow
                label="OCR Clipboard on Launch"
                description="Auto-process clipboard on start"
                checked={settings.autoProcessClipboard}
                onChange={(value) => onUpdate({ autoProcessClipboard: value })}
              />
              <ToggleRow
                label="Trim Whitespace"
                description="Remove leading/trailing spaces"
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
                label="Collapse Whitespace"
                description="Convert multiple spaces to one"
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
                label="Flatten Line Breaks"
                description="Replace newlines with spaces"
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
            </>
          )}
        </div>
      </section>
    </div>
  );
};
