"use client";

import { type ChangeEventHandler, useMemo } from "react";
import { Copy, Loader2, RefreshCw } from "lucide-react";

interface TextPanelProps {
  text: string;
  isProcessing: boolean;
  onChangeText: (value: string) => void;
  onCopy: () => void;
  onRerun: () => void;
  canCopy: boolean;
}

export const TextPanel = ({
  text,
  isProcessing,
  onChangeText,
  onCopy,
  onRerun,
  canCopy,
}: TextPanelProps) => {
  const lines = useMemo(
    () => (text.trim().length > 0 ? text.split("\n") : []),
    [text]
  );

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    onChangeText(event.target.value);
  };

  return (
    <div className="flex h-full min-h-[260px] w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white text-sm dark:border-gray-700 dark:bg-gray-800 md:min-h-0">
      <div className="flex min-h-[44px] flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-1.5 text-gray-600 dark:border-gray-700 dark:text-gray-300">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          OCR Result
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRerun}
            disabled={isProcessing}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition hover:border-gray-400 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500"
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition hover:border-gray-400 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500"
            title="Copy text"
          >
            <Copy size={16} />
            <span className="sr-only">Copy recognized text</span>
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 px-3 py-3">
          <textarea
            value={text}
            onChange={handleChange}
            placeholder={isProcessing ? "Running OCR…" : "OCR not run yet."}
            className="h-full w-full resize-none rounded-md border border-gray-200 bg-white p-3 font-sans text-sm leading-relaxed text-gray-800 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-blue-400/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-500"
            spellCheck={false}
          />
        </div>
        <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {lines.length} lines / {text.length} characters
        </div>
      </div>
    </div>
  );
};
