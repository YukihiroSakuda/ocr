'use client';

import { useEffect } from 'react';
import type { AppSettings } from '@/types/desktop';

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings | null;
  onUpdate: (patch: Partial<AppSettings>) => void;
}

const ToggleRow = ({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <label className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800">
    <span>{label}</span>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
  </label>
);

export const SettingsSheet = ({ open, onClose, settings, onUpdate }: SettingsSheetProps) => {
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
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <section className="relative ml-auto flex h-full w-full max-w-sm flex-col border-l border-gray-200 bg-white text-sm dark:border-gray-700 dark:bg-gray-900">
        <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="text-base font-semibold">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-200"
          >
            Close
          </button>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {!settings ? (
            <p className="text-gray-500 dark:text-gray-400">Loading settings…</p>
          ) : (
            <>
              <ToggleRow
                label="Auto copy after OCR"
                checked={settings.autoCopy}
                onChange={(value) => onUpdate({ autoCopy: value })}
              />
              <ToggleRow
                label="OCR clipboard on launch"
                checked={settings.autoProcessClipboard}
                onChange={(value) => onUpdate({ autoProcessClipboard: value })}
              />
              <ToggleRow
                label="Trim leading and trailing whitespace"
                checked={settings.textNormalization.trimWhitespace}
                onChange={(value) =>
                  onUpdate({ textNormalization: { ...settings.textNormalization, trimWhitespace: value } })
                }
              />
              <ToggleRow
                label="Collapse repeated whitespace"
                checked={settings.textNormalization.collapseWhitespace}
                onChange={(value) =>
                  onUpdate({ textNormalization: { ...settings.textNormalization, collapseWhitespace: value } })
                }
              />
              <ToggleRow
                label="Replace line breaks with spaces"
                checked={settings.textNormalization.removeLineBreaks}
                onChange={(value) =>
                  onUpdate({ textNormalization: { ...settings.textNormalization, removeLineBreaks: value } })
                }
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">History limit</label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={settings.maxHistoryItems}
                  onChange={(event) => {
                    const next = Number.parseInt(event.target.value, 10);
                    onUpdate({ maxHistoryItems: Number.isNaN(next) ? settings.maxHistoryItems : next });
                  }}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-gray-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['system', 'light', 'dark'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onUpdate({ theme: mode })}
                      className={`rounded-md border px-2 py-1 text-xs ${
                        settings.theme === mode
                          ? 'border-gray-600 bg-gray-100 text-gray-800 dark:border-gray-400 dark:bg-gray-700 dark:text-gray-100'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
