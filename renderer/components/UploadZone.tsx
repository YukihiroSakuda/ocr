'use client';

import { Clipboard, Upload } from 'lucide-react';

interface UploadZoneProps {
  onClipboard: () => void;
  onFile: () => void;
  isProcessing: boolean;
  isDragging: boolean;
}

export function UploadZone({
  onClipboard,
  onFile,
  isProcessing,
  isDragging
}: UploadZoneProps) {
  return (
    <div className="grid h-full w-full grid-cols-1 gap-4 md:grid-cols-2">
      {/* Left: Clipboard - Entire Area Clickable */}
      <button
        type="button"
        onClick={onClipboard}
        disabled={isProcessing}
        className="relative flex min-h-0 w-full flex-col items-center justify-center rounded-2xl border-2 border-[var(--border-strong)] bg-[var(--surface-raised)] p-8 backdrop-blur-2xl transition-all hover:scale-[1.02] hover:border-[var(--accent-base)] hover:shadow-2xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <div className="flex flex-col items-center gap-8 pointer-events-none">
          <div className="rounded-full bg-[var(--accent-soft)]/20 p-8">
            <Clipboard size={64} className="text-[var(--accent-base)]" />
          </div>

          <h2 className="text-3xl font-bold text-[var(--text-primary)]">
            Clipboard
          </h2>

          <div className="flex items-center gap-2 text-lg font-semibold text-[var(--accent-base)]">
            <span>Click to Paste</span>
          </div>
        </div>
      </button>

      {/* Right: Drop Zone & File Selection - Entire Area Clickable */}
      <button
        type="button"
        onClick={onFile}
        disabled={isProcessing}
        className="relative flex min-h-0 w-full flex-col items-center justify-center rounded-2xl border-2 border-[var(--border-strong)] bg-[var(--surface-raised)] p-8 backdrop-blur-2xl transition-all hover:scale-[1.02] hover:border-[var(--accent-base)] hover:shadow-2xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <div className="flex flex-col items-center gap-8 pointer-events-none">
          <div className="rounded-full bg-[var(--accent-soft)]/20 p-8">
            <Upload size={64} className="text-[var(--accent-base)]" />
          </div>

          <h3 className="text-3xl font-bold text-[var(--text-primary)]">
            Select File
          </h3>

          <div className="flex items-center gap-2 text-lg font-semibold text-[var(--accent-base)]">
            <span>Click or Drop</span>
          </div>

          <p className="text-xs text-[var(--text-tertiary)]">
            PNG • JPG • PDF
          </p>
        </div>

        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl border-4 border-dashed border-sky-400 bg-sky-500/30 backdrop-blur-sm pointer-events-none">
            <div className="space-y-2 text-center">
              <Upload size={48} className="mx-auto text-sky-100" />
              <p className="text-xl font-bold text-sky-100">
                Drop to Upload
              </p>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
