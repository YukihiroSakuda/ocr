"use client";

import { type ChangeEventHandler, useMemo } from "react";
import { Copy, Loader2, RefreshCw } from "lucide-react";

interface TextPanelProps {
  text: string;
  confidence: number | null;
  isProcessing: boolean;
  onChangeText: (value: string) => void;
  onCopy: () => void;
  onRerun: () => void;
  canCopy: boolean;
  hasImage: boolean;
}

export const TextPanel = ({
  text,
  confidence,
  isProcessing,
  onChangeText,
  onCopy,
  onRerun,
  canCopy,
  hasImage,
}: TextPanelProps) => {
  const lines = useMemo(
    () => (text.trim().length > 0 ? text.split("\n") : []),
    [text]
  );

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    onChangeText(event.target.value);
  };

  const formattedConfidence =
    confidence === null || Number.isNaN(confidence)
      ? "---"
      : `${Math.round(confidence)}%`;

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden border border-[var(--border-strong)] bg-[var(--surface)] text-sm text-[var(--text-primary)]"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="flex min-h-[48px] flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-[var(--text-secondary)]">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-[var(--text-tertiary)]">
            OUTPUT_TXT
          </span>
          <span className="inline-flex items-center gap-2 border border-[var(--control-border)] bg-[var(--control-surface)] px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            <span className="text-[var(--text-tertiary)]">CONF</span>
            <span className="text-[var(--accent-base)]">
              {formattedConfidence}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRerun}
            disabled={isProcessing || !hasImage}
            className="inline-flex items-center justify-center border border-[var(--control-border)] bg-[var(--control-surface)] p-1.5 text-[var(--text-secondary)] transition hover:border-[var(--accent-base)] hover:bg-[var(--control-surface-hover)] hover:text-[var(--accent-base)] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-transparent disabled:text-[var(--control-disabled)]"
            title="Re-run OCR"
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            <span className="sr-only">Re-run OCR</span>
          </button>
          <button
            type="button"
            onClick={onCopy}
            disabled={!canCopy}
            className="inline-flex items-center justify-center border border-[var(--control-border)] bg-[var(--control-surface)] p-1.5 text-[var(--text-secondary)] transition hover:border-[var(--accent-base)] hover:bg-[var(--control-surface-hover)] hover:text-[var(--accent-base)] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-transparent disabled:text-[var(--control-disabled)]"
            title="Copy text"
          >
            <Copy size={16} />
            <span className="sr-only">Copy recognized text</span>
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <textarea
            value={text}
            onChange={handleChange}
            placeholder={isProcessing ? "Running OCR..." : undefined}
            className="h-full w-full resize-none border-0 bg-[var(--input-surface)] px-4 py-4 font-sans text-base leading-relaxed text-left text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] md:px-6 md:py-6"
            spellCheck={false}
          />
        </div>
        <div className="border-t border-[var(--border)] px-4 py-3 text-xs uppercase tracking-wide text-[var(--text-secondary)]">
          {lines.length} Lines | {text.length} Characters
        </div>
      </div>
    </div>
  );
};
