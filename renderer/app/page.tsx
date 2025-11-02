"use client";

import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { ImagePreview } from "@/components/ImagePreview";
import { TextPanel } from "@/components/TextPanel";
import { UploadZone } from "@/components/UploadZone";
import { HistoryDrawer } from "@/components/history/HistoryDrawer";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { LanguageOverlay } from "@/components/settings/LanguageOverlay";
import { getLanguageLabels, parseLanguageString } from "@/lib/languages";
import { useAppStore } from "@/store/app-store";
import type { ThemePreference } from "@/types/desktop";
import { Languages, History, Settings } from "lucide-react";

const applyTheme = (theme: ThemePreference) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolveTheme = (): ThemePreference => {
    if (theme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      return prefersDark ? "dark" : "light";
    }
    return theme;
  };
  root.setAttribute("data-theme", resolveTheme());
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
    processDroppedFile,
    rerunOCR,
    history,
    applyHistoryEntry,
    deleteHistoryEntry,
    clearHistory,
    isHistoryLoading,
    settings,
    updateSettings,
    setUserText,
    error,
    clearAll,
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
      processDroppedFile: state.processDroppedFile,
      rerunOCR: state.rerunOCR,
      history: state.history,
      applyHistoryEntry: state.applyHistoryEntry,
      deleteHistoryEntry: state.deleteHistoryEntry,
      clearHistory: state.clearHistory,
      isHistoryLoading: state.isHistoryLoading,
      settings: state.settings,
      updateSettings: state.updateSettings,
      setUserText: state.setUserText,
      error: state.error,
      clearAll: state.clearAll,
    }))
  );

  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const currentTheme = settings?.theme;

  useEffect(() => {
    if (!currentTheme) return;
    applyTheme(currentTheme);
    if (currentTheme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = (event: MediaQueryListEvent) => {
        applyTheme(event.matches ? "dark" : "light");
      };
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
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
  const languageCodes = useMemo(
    () => parseLanguageString(settings?.language),
    [settings?.language]
  );
  const languageLabels = useMemo(
    () => getLanguageLabels(languageCodes),
    [languageCodes]
  );

  const handleCopy = async () => {
    if (!canCopy || typeof window === "undefined") {
      return;
    }
    try {
      await window.desktopAPI.writeClipboardText(text);
      setFeedback("Copied text to clipboard.");
    } catch (copyError) {
      console.error(copyError);
      setFeedback("Failed to copy text.");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isProcessing) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) =>
      file.type.startsWith("image/") || file.type === "application/pdf"
    );

    if (!imageFile) {
      setFeedback("Please drop an image or PDF file.");
      return;
    }

    // In Electron, File objects have a 'path' property
    const filePath = (imageFile as File & { path: string }).path;

    if (!filePath) {
      setFeedback("Could not access file path.");
      return;
    }

    // Process the dropped file
    await processDroppedFile(filePath);
  };

  return (
    <>
      <main
        className="flex h-screen flex-col items-center overflow-hidden px-4 py-4 text-[var(--text-primary)] transition-colors"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex w-full max-w-6xl flex-1 min-h-0 flex-col gap-4">
          <header
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-raised)] px-5 py-4 backdrop-blur-2xl"
            style={{ boxShadow: "var(--shadow)" }}
          >
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-soft)]">
                Extract text from any image or screen in one click.
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                Screenshot OCR Console
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-medium tracking-wide text-[var(--text-secondary)]">
                {!settings
                  ? "Loading languages..."
                  : languageLabels.length
                  ? languageLabels.join(", ")
                  : "No languages selected"}
              </span>
              <button
                type="button"
                onClick={() => (settings ? setLanguageOpen(true) : undefined)}
                disabled={!settings}
                title="Language"
                className="inline-flex items-center justify-center rounded-lg border border-[var(--control-border)] bg-[var(--control-surface)] p-2 text-[var(--text-primary)] transition hover:bg-[var(--control-surface-hover)] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-transparent disabled:text-[var(--control-disabled)]"
              >
                <Languages size={18} />
              </button>
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                title="History"
                className="inline-flex items-center justify-center rounded-lg border border-[var(--control-border)] bg-[var(--control-surface)] p-2 text-[var(--text-primary)] transition hover:bg-[var(--control-surface-hover)]"
              >
                <History size={18} />
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                title="Settings"
                className="inline-flex items-center justify-center rounded-lg border border-[var(--control-border)] bg-[var(--control-surface)] p-2 text-[var(--text-primary)] transition hover:bg-[var(--control-surface-hover)]"
              >
                <Settings size={18} />
              </button>
            </div>
          </header>

          {errorMessage && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/12 px-4 py-2 text-[11px] font-semibold text-red-200 backdrop-blur-xl">
              {errorMessage}
            </div>
          )}

          {!sourceImage ? (
            <section className="w-full flex-1 min-h-0">
              <UploadZone
                onClipboard={processClipboard}
                onFile={processFileSelection}
                isProcessing={isProcessing}
                isDragging={isDragging}
              />
            </section>
          ) : (
            <section className="grid w-full flex-1 min-h-0 grid-cols-1 gap-4 md:grid-cols-[1.05fr_1fr]">
              <div className="flex min-h-0 w-full">
                <ImagePreview
                  image={sourceImage}
                  processedImage={processedImage}
                  isProcessing={isProcessing}
                  statusMessage={statusMessage}
                  onClear={clearAll}
                />
              </div>
              <div className="flex min-h-0 w-full">
                <TextPanel
                  text={text}
                  confidence={confidence}
                  isProcessing={isProcessing}
                  onChangeText={setUserText}
                  onCopy={handleCopy}
                  onRerun={rerunOCR}
                  canCopy={canCopy}
                  hasImage={sourceImage !== null}
                />
              </div>
            </section>
          )}
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

        <LanguageOverlay
          open={languageOpen}
          currentLanguage={settings?.language ?? null}
          onClose={() => setLanguageOpen(false)}
          onSave={async (value) => {
            await updateSettings({ language: value });
            setLanguageOpen(false);
          }}
        />
      </main>
      {isDragging && sourceImage && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-sky-500/20 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-sky-400 bg-sky-500/30 px-8 py-6 text-center">
            <p className="text-xl font-semibold text-sky-100">
              Drop image or PDF to process
            </p>
          </div>
        </div>
      )}
      {feedback && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-xs rounded-xl border border-sky-600 bg-sky-700 px-5 py-4 text-center text-sm font-semibold text-white shadow-2xl">
            {feedback}
          </div>
        </div>
      )}
    </>
  );
}

export default HomePage;
