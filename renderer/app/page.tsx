"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { ImagePreview } from "@/components/ImagePreview";
import { TextPanel } from "@/components/TextPanel";
import { UploadZone } from "@/components/UploadZone";
import { HistoryDrawer } from "@/components/history/HistoryDrawer";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { LanguageOverlay } from "@/components/settings/LanguageOverlay";
import { getLanguageLabels, parseLanguageString } from "@/lib/languages";
import { useAppStore } from "@/store/app-store";
import { Languages, History, Settings } from "lucide-react";
import * as webAPI from "@/lib/web-api";

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
    processFile,
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
    changePdfPage,
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
      processFile: state.processFile,
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
      changePdfPage: state.changePdfPage,
    }))
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

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
      await webAPI.writeClipboardText(text);
      setFeedback("Copied text to clipboard.");
    } catch (copyError) {
      console.error(copyError);
      setFeedback("Failed to copy text.");
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file);

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    const file = files.find((f) =>
      f.type.startsWith("image/") || f.type === "application/pdf"
    );

    if (!file) {
      setFeedback("Please drop an image or PDF file.");
      return;
    }

    // Process the dropped file directly
    await processFile(file);
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
            className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-strong)] bg-[var(--surface)] px-5 py-3"
            style={{ boxShadow: "var(--shadow)" }}
          >
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-tertiary)] font-mono">
                <span className="text-[var(--accent-pink)]">O</span>PTICAL <span className="text-[var(--accent-pink)]">C</span>HARACTER <span className="text-[var(--accent-pink)]">R</span>ECOGNITION
              </p>
              <h1 className="text-lg font-bold tracking-tight text-[var(--accent-base)] font-mono">
                &gt; OCR_CONSOLE
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono tracking-wide text-[var(--text-secondary)] uppercase">
                {!settings
                  ? "LOADING..."
                  : languageLabels.length
                  ? languageLabels.join(" / ")
                  : "NO LANG"}
              </span>
              <button
                type="button"
                onClick={() => (settings ? setLanguageOpen(true) : undefined)}
                disabled={!settings}
                title="Language"
                className="inline-flex items-center justify-center border border-[var(--control-border)] bg-[var(--control-surface)] p-1.5 text-[var(--text-primary)] transition hover:border-[var(--accent-base)] hover:bg-[var(--control-surface-hover)] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-transparent disabled:text-[var(--control-disabled)]"
              >
                <Languages size={16} />
              </button>
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                title="History"
                className="inline-flex items-center justify-center border border-[var(--control-border)] bg-[var(--control-surface)] p-1.5 text-[var(--text-primary)] transition hover:border-[var(--accent-base)] hover:bg-[var(--control-surface-hover)]"
              >
                <History size={16} />
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                title="Settings"
                className="inline-flex items-center justify-center border border-[var(--control-border)] bg-[var(--control-surface)] p-1.5 text-[var(--text-primary)] transition hover:border-[var(--accent-base)] hover:bg-[var(--control-surface-hover)]"
              >
                <Settings size={16} />
              </button>
            </div>
          </header>

          {errorMessage && (
            <div className="border border-red-500/50 bg-red-500/10 px-4 py-2 text-[11px] font-mono text-red-400">
              ERROR: {errorMessage}
            </div>
          )}

          {!sourceImage ? (
            <section className="w-full flex-1 min-h-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadZone
                onClipboard={processClipboard}
                onFile={handleFileSelect}
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
                  onPageChange={changePdfPage}
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
          <div className="w-full max-w-xs border-2 border-[var(--accent-pink)] bg-black px-5 py-4 text-center font-mono text-sm font-semibold uppercase tracking-wide text-[var(--accent-pink)]" style={{ boxShadow: 'var(--glow-pink)' }}>
            {feedback}
          </div>
        </div>
      )}
    </>
  );
}

export default HomePage;
