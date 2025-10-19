'use client';

import { create } from 'zustand';
import type {
  AppSettings,
  ClipboardImageResult,
  DesktopAPI,
  HistoryEntry,
  HistoryInput,
  ImageDialogResult
} from '@/types/desktop';
import { runOCR } from '@/lib/ocr';
import { renderPdfFirstPage } from '@/lib/pdf';

type ImageOrigin = 'clipboard' | 'file' | 'pdf' | 'history';

export interface SourceImage {
  filePath: string;
  dataUrl: string;
  width?: number;
  height?: number;
  origin: ImageOrigin;
}

export interface RecognitionState {
  sourceImage: SourceImage | null;
  processedImage: string | null;
  text: string;
  confidence: number | null;
  isProcessing: boolean;
  progress: number;
  statusMessage: string;
  error: string | null;
  lastProcessedAt: number | null;
  settings: AppSettings | null;
  history: HistoryEntry[];
  isHistoryLoading: boolean;
  desktopReady: boolean;
  initialize: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  processClipboard: () => Promise<void>;
  processFileSelection: () => Promise<void>;
  rerunOCR: () => Promise<void>;
  applyHistoryEntry: (entry: HistoryEntry) => Promise<void>;
  deleteHistoryEntry: (id: number) => Promise<void>;
  clearHistory: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
}

const normalizeText = (text: string, settings: AppSettings['textNormalization']) => {
  let output = text;
  if (settings.removeLineBreaks) {
    output = output.replace(/\r?\n+/g, ' ');
  }
  if (settings.collapseWhitespace) {
    output = output.replace(/\s+/g, ' ');
  }
  if (settings.trimWhitespace) {
    output = output.trim();
  }
  return output;
};

const getDesktopAPI = (): DesktopAPI | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.desktopAPI ?? null;
};

const prepareClipboardImage = async (result: ClipboardImageResult | null): Promise<SourceImage | null> => {
  if (!result) {
    return null;
  }
  return {
    filePath: result.filePath,
    dataUrl: result.dataUrl,
    width: result.width,
    height: result.height,
    origin: 'clipboard'
  };
};

const prepareDialogImage = async (result: ImageDialogResult | null): Promise<SourceImage | null> => {
  if (!result) {
    return null;
  }

  if (result.type === 'image') {
    const api = getDesktopAPI();
    const dataUrl =
      result.dataUrl ??
      (api ? await api.readFileDataUrl(result.filePath) : `file://${result.filePath}`);
    return {
      filePath: result.filePath,
      dataUrl,
      origin: 'file'
    };
  }

  if (result.type === 'pdf') {
    const rendered = await renderPdfFirstPage(result.data);
    const api = getDesktopAPI();
    if (!api) {
      throw new Error('Desktop bridge is not available.');
    }
    const { filePath } = await api.saveDataUrl({
      dataUrl: rendered.dataUrl,
      prefix: 'pdf-page'
    });
    return {
      filePath,
      dataUrl: rendered.dataUrl,
      width: rendered.width,
      height: rendered.height,
      origin: 'pdf'
    };
  }

  return null;
};

let unsubscribeHistory: (() => void) | null = null;

export const useAppStore = create<RecognitionState>((set, get) => ({
  sourceImage: null,
  processedImage: null,
  text: '',
  confidence: null,
  isProcessing: false,
  progress: 0,
  statusMessage: '',
  error: null,
  lastProcessedAt: null,
  settings: null,
  history: [],
  isHistoryLoading: false,
  desktopReady: false,

  initialize: async () => {
    const api = getDesktopAPI();
    if (!api) {
      set({ error: 'Desktop API is unavailable.' });
      return;
    }

    try {
      const settings = await api.getSettings();
      set({ settings, desktopReady: true, error: null });

      await get().refreshHistory();

      if (settings.autoProcessClipboard) {
        await get().processClipboard();
      }

      if (unsubscribeHistory) {
        unsubscribeHistory();
      }
      unsubscribeHistory = api.onHistoryUpdated(async () => {
        await get().refreshHistory();
      });
    } catch (error) {
      console.error(error);
      set({ error: 'Failed to initialize application.' });
    }
  },

  refreshHistory: async () => {
    const api = getDesktopAPI();
    if (!api) return;
    set({ isHistoryLoading: true });
    try {
      const history = await api.listHistory();
      set({ history, isHistoryLoading: false });
    } catch (error) {
      console.error(error);
      set({ isHistoryLoading: false, error: 'Failed to load history.' });
    }
  },

  processClipboard: async () => {
    const api = getDesktopAPI();
    if (!api) {
      set({ error: 'Clipboard access is unavailable.' });
      return;
    }
    if (get().isProcessing) {
      return;
    }
    set({ error: null });
    const image = await prepareClipboardImage(await api.getClipboardImage());
    if (!image) {
      return;
    }
    await processImage(image, set, get);
  },

  processFileSelection: async () => {
    const api = getDesktopAPI();
    if (!api) {
      set({ error: 'File dialog is unavailable.' });
      return;
    }
    if (get().isProcessing) {
      return;
    }
    set({ error: null });
    const image = await prepareDialogImage(await api.openImageDialog());
    if (!image) {
      return;
    }
    await processImage(image, set, get);
  },

  rerunOCR: async () => {
    const current = get().sourceImage;
    if (!current || get().isProcessing) {
      return;
    }
    await processImage(current, set, get);
  },

  applyHistoryEntry: async (entry: HistoryEntry) => {
    const api = getDesktopAPI();
    if (!api) {
      set({ error: 'History is unavailable.' });
      return;
    }
    try {
      const dataUrl = await api.readFileDataUrl(entry.imagePath);
      const image: SourceImage = {
        filePath: entry.imagePath,
        dataUrl,
        origin: 'history'
      };
      set({
        sourceImage: image,
        processedImage: null,
        text: entry.textResult,
        confidence: entry.confidence,
        error: null
      });
    } catch (error) {
      console.error(error);
      set({ error: 'Failed to open history image.' });
    }
  },

  deleteHistoryEntry: async (id: number) => {
    const api = getDesktopAPI();
    if (!api) return;
    try {
      await api.deleteHistory(id);
      await get().refreshHistory();
    } catch (error) {
      console.error(error);
      set({ error: 'Failed to delete history.' });
    }
  },

  clearHistory: async () => {
    const api = getDesktopAPI();
    if (!api) return;
    try {
      await api.clearHistory();
      set({ history: [] });
    } catch (error) {
      console.error(error);
      set({ error: 'Failed to clear history.' });
    }
  },

  updateSettings: async (patch: Partial<AppSettings>) => {
    const api = getDesktopAPI();
    if (!api) return;
    try {
      const updated = await api.updateSettings(patch);
      set({ settings: updated });
    } catch (error) {
      console.error(error);
      set({ error: 'Failed to update settings.' });
    }
  }
}));

const processImage = async (
  image: SourceImage,
  set: (partial: Partial<RecognitionState>) => void,
  get: () => RecognitionState
) => {
  const api = getDesktopAPI();
  if (!api) {
    set({ error: 'Desktop API is unavailable.' });
    return;
  }

  const settings = get().settings;
  if (!settings) {
    await get().initialize();
  }

  const effectiveSettings = get().settings;
  if (!effectiveSettings) {
    set({ error: 'Failed to load settings.' });
    return;
  }

  set({
    sourceImage: image,
    processedImage: null,
    isProcessing: true,
    progress: 0,
    statusMessage: 'Running OCR…',
    error: null
  });

  try {
    const result = await runOCR(image.dataUrl, effectiveSettings.language);
    const normalizedText = normalizeText(result.text, effectiveSettings.textNormalization);

    set({
      text: normalizedText,
      confidence: result.confidence,
      isProcessing: false,
      progress: 1,
      statusMessage: 'Completed',
      lastProcessedAt: Date.now(),
      sourceImage: image
    });

    if (effectiveSettings.autoCopy) {
      api.writeClipboardText(normalizedText).catch((copyError) => {
        console.warn('Failed to copy text', copyError);
      });
    }

    const historyPayload: HistoryInput = {
      imagePath: image.filePath,
      textResult: normalizedText,
      confidence: result.confidence,
      lang: effectiveSettings.language,
      engine: 'tesseract-local'
    };
    await api.saveHistory(historyPayload);
  } catch (error) {
    console.error(error);
    set({
      error: 'OCR processing failed.',
      isProcessing: false,
      statusMessage: '',
      progress: 0
    });
  }
};
