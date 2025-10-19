'use client';

import { Fragment, useMemo } from 'react';
import { BadgeCheck, Timer } from 'lucide-react';

interface TextPanelProps {
  text: string;
  confidence: number | null;
  isProcessing: boolean;
  lastProcessedAt: number | null;
}

const formatConfidence = (confidence: number | null) => {
  if (confidence === null || Number.isNaN(confidence)) {
    return '---';
  }
  return `${Math.round(confidence)}%`;
};

const formatTimestamp = (timestamp: number | null) => {
  if (!timestamp) return '未処理';
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export const TextPanel = ({ text, confidence, isProcessing, lastProcessedAt }: TextPanelProps) => {
  const hasText = text.trim().length > 0;
  const lines = useMemo(() => (hasText ? text.split('\n') : []), [hasText, text]);

  return (
    <div className="flex h-full min-h-[260px] w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white text-sm dark:border-gray-700 dark:bg-gray-800 md:min-h-0">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-1.5 text-gray-600 dark:border-gray-700 dark:text-gray-300">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Recognized Text</span>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-gray-600 dark:border-gray-600 dark:text-gray-200">
            <BadgeCheck size={14} />
            Confidence {formatConfidence(confidence)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-gray-600 dark:border-gray-600 dark:text-gray-200">
            <Timer size={14} />
            {formatTimestamp(lastProcessedAt)}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto px-3 py-3 leading-relaxed text-gray-800 dark:text-gray-100">
          {isProcessing && !hasText ? (
            <p className="text-gray-500 dark:text-gray-400">Running OCR…</p>
          ) : !hasText ? (
            <p className="text-gray-500 dark:text-gray-400">No text available yet.</p>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {lines.map((line, index) => (
                <Fragment key={`${line}-${index}`}>
                  {line}
                  {'\n'}
                </Fragment>
              ))}
            </pre>
          )}
        </div>
        <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {lines.length} lines / {text.length} characters
        </div>
      </div>
    </div>
  );
};
