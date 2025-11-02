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
    <div className="grid h-full w-full grid-cols-1 gap-3 md:grid-cols-2">
      {/* Left: Clipboard - Entire Area Clickable */}
      <button
        type="button"
        onClick={onClipboard}
        disabled={isProcessing}
        className="group relative flex min-h-0 w-full flex-col items-center justify-center border border-[var(--border-strong)] bg-[var(--surface)] p-8 transition-all hover:border-[var(--accent-base)] hover:bg-[var(--surface-raised)] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ boxShadow: 'var(--glow)' }}></div>
        <div className="relative flex flex-col items-center gap-4 pointer-events-none max-w-md">
          <div className="border border-[var(--border)] bg-[var(--surface-raised)] p-6 transition-all group-hover:border-[var(--accent-base)]" style={{ boxShadow: 'var(--glow)' }}>
            <Clipboard size={48} className="text-[var(--accent-base)]" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-mono uppercase">
            Clipboard
          </h2>

          <div className="flex flex-col items-center gap-2 text-center">
            <p className="font-mono text-[10px] leading-relaxed text-[var(--text-secondary)] uppercase tracking-wide">
              Direct access to system clipboard buffer. Reads image data from memory without disk I/O operations. Supports PNG, JPEG, BMP formats in native image buffer.
            </p>
            <p className="font-mono text-[9px] text-[var(--text-tertiary)] uppercase tracking-wide">
              Click to initialize clipboard read operation
            </p>
          </div>
        </div>
      </button>

      {/* Right: Drop Zone & File Selection - Entire Area Clickable */}
      <button
        type="button"
        onClick={onFile}
        disabled={isProcessing}
        className="group relative flex min-h-0 w-full flex-col items-center justify-center border border-[var(--border-strong)] bg-[var(--surface)] p-8 transition-all hover:border-[var(--accent-base)] hover:bg-[var(--surface-raised)] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ boxShadow: 'var(--glow)' }}></div>
        <div className="relative flex flex-col items-center gap-4 pointer-events-none max-w-md">
          <div className="border border-[var(--border)] bg-[var(--surface-raised)] p-6 transition-all group-hover:border-[var(--accent-base)]" style={{ boxShadow: 'var(--glow)' }}>
            <Upload size={48} className="text-[var(--accent-base)]" />
          </div>

          <h3 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-mono uppercase">
            Select File
          </h3>

          <div className="flex flex-col items-center gap-2 text-center">
            <p className="font-mono text-[10px] leading-relaxed text-[var(--text-secondary)] uppercase tracking-wide">
              Import image files from local file system. Supports drag & drop file transfer protocol. Handles raster image formats (PNG, JPG, BMP) and vector PDF documents with automatic page rendering.
            </p>
            <p className="font-mono text-[9px] text-[var(--text-tertiary)] uppercase tracking-wide">
              Click to open file dialog / Drag files into zone
            </p>
          </div>
        </div>

        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center border-2 border-[var(--accent-base)] bg-[var(--accent-base)]/10 backdrop-blur-sm pointer-events-none" style={{ boxShadow: 'var(--glow-strong)' }}>
            <div className="space-y-3 text-center">
              <Upload size={48} className="mx-auto text-[var(--accent-base)]" />
              <p className="font-mono text-lg font-bold text-[var(--accent-base)] uppercase tracking-wide">
                DROP TO UPLOAD
              </p>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
