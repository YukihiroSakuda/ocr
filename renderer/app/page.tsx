'use client';

import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ImagePreview } from '@/components/ImagePreview';
import { TextPanel } from '@/components/TextPanel';
import { ActionBar } from '@/components/ActionBar';
import { HistoryDrawer } from '@/components/history/HistoryDrawer';
import { SettingsSheet } from '@/components/settings/SettingsSheet';
import { useAppStore } from '@/store/app-store';
import type { ThemePreference } from '@/types/desktop';

const applyTheme = (theme: ThemePreference) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const resolveTheme = (): ThemePreference => {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return theme;
  };
  root.setAttribute('data-theme', resolveTheme());
};

function HomePage() {
  const {
    initialize,
    sourceImage,
    processedImage,
    text,
    confidence,
    isProcessing,
    statusMessage,
    processClipboard,
    processFileSelection,
    rerunOCR,
    history,
    applyHistoryEntry,
    deleteHistoryEntry,
    clearHistory,
    isHistoryLoading,
    settings,
    updateSettings,
    lastProcessedAt,
    error
  } = useAppStore(
    useShallow((state) => ({
      initialize: state.initialize,
      sourceImage: state.sourceImage,
      processedImage: state.processedImage,
      text: state.text,
      confidence: state.confidence,
      isProcessing: state.isProcessing,
      statusMessage: state.statusMessage,
      processClipboard: state.processClipboard,
      processFileSelection: state.processFileSelection,
      rerunOCR: state.rerunOCR,
      history: state.history,
      applyHistoryEntry: state.applyHistoryEntry,
      deleteHistoryEntry: state.deleteHistoryEntry,
      clearHistory: state.clearHistory,
      isHistoryLoading: state.isHistoryLoading,
      settings: state.settings,
      updateSettings: state.updateSettings,
      lastProcessedAt: state.lastProcessedAt,
      error: state.error
    }))
  );

  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const currentTheme = settings?.theme;

  useEffect(() => {
    if (!currentTheme) return;
    applyTheme(currentTheme);
    if (currentTheme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (event: MediaQueryListEvent) => {
        applyTheme(event.matches ? 'dark' : 'light');
      };
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
    return undefined;
  }, [currentTheme]);

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = window.setTimeout(() => setFeedback(null), 2200);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const canCopy = text.trim().length > 0;
  const errorMessage = useMemo(() => error, [error]);

  const handleCopy = async () => {
    if (!canCopy || typeof window === 'undefined') {
      return;
    }
    try {
      await window.desktopAPI.writeClipboardText(text);
      setFeedback('Copied text to clipboard.');
    } catch (copyError) {
      console.error(copyError);
      setFeedback('Failed to copy text.');
    }
  };

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-gray-50 text-gray-900 transition dark:bg-gray-900 dark:text-gray-100">
      <div className="flex w-full flex-1 flex-col gap-2 overflow-hidden px-2 py-3 md:px-4 md:py-4">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Screenshot OCR</h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">Local OCR for screenshots, images, and PDFs.</p>
        </header>

        {feedback && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            {feedback}
          </div>
        )}
        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
            {errorMessage}
          </div>
        )}

        <section className="flex w-full flex-1 min-h-0 flex-col gap-3 overflow-hidden md:flex-row">
          <div className="flex min-h-0 w-full flex-1 overflow-hidden">
            <ImagePreview
              image={sourceImage}
              processedImage={processedImage}
              isProcessing={isProcessing}
              statusMessage={statusMessage}
            />
          </div>
          <div className="flex min-h-0 w-full flex-1 overflow-hidden">
            <TextPanel
              text={text}
              confidence={confidence}
              isProcessing={isProcessing}
              lastProcessedAt={lastProcessedAt}
            />
          </div>
        </section>

        <ActionBar
          onClipboard={processClipboard}
          onFile={processFileSelection}
          onRerun={rerunOCR}
          onCopy={handleCopy}
          onHistory={() => setHistoryOpen(true)}
          onSettings={() => setSettingsOpen(true)}
          isProcessing={isProcessing}
          canCopy={canCopy}
        />
      </div>

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onSelect={async (entry) => {
          await applyHistoryEntry(entry);
          setHistoryOpen(false);
        }}
        onDelete={deleteHistoryEntry}
        onClear={async () => {
          await clearHistory();
          setHistoryOpen(false);
        }}
        isLoading={isHistoryLoading}
      />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdate={updateSettings}
      />
    </main>
  );
}

export default HomePage;
