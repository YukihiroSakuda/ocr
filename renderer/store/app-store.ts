'use client';

import { create } from 'zustand';
import type {
  AppSettings,
  HistoryEntry,
  HistoryInput,
} from '@/types/desktop';
import { runOCR } from '@/lib/ocr';
import { renderPdfFirstPage, renderPdfPage, getPdfInfo } from '@/lib/pdf';
import { db } from '@/lib/indexeddb';
import * as webAPI from '@/lib/web-api';

type ImageOrigin = 'clipboard' | 'file' | 'pdf' | 'history';

export interface SourceImage {
  filePath: string;
  dataUrl: string;
  width?: number;
  height?: number;
  origin: ImageOrigin;
  pdfData?: string;
  currentPage?: number;
  totalPages?: number;
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
  processFile: (file: File) => Promise<void>;
  rerunOCR: () => Promise<void>;
  applyHistoryEntry: (entry: HistoryEntry) => Promise<void>;
  deleteHistoryEntry: (id: number) => Promise<void>;
  clearHistory: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  setUserText: (value: string) => void;
  clearAll: () => void;
  changePdfPage: (pageNumber: number) => Promise<void>;
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

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  language: 'jpn', // Changed from 'jpn+eng' for better Japanese OCR accuracy
  psmMode: 'SPARSE_TEXT', // Page Segmentation Mode
  autoCopy: false,
  autoProcessClipboard: false,
  textNormalization: {
    trimWhitespace: true,
    collapseWhitespace: true,
    removeLineBreaks: false,
  },
};

// Settings management using localStorage
const SETTINGS_KEY = 'ocr-app-settings';

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }

  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

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
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const settings = loadSettings();
      set({ settings, desktopReady: true, error: null });

      await get().refreshHistory();

      // Auto-process clipboard is not automatically supported in web
      // Users must click a button to access clipboard due to permissions
    } catch (error) {
      console.error(error);
      set({ error: 'Failed to initialize application.' });
    }
  },

  refreshHistory: async () => {
    set({ isHistoryLoading: true });
    try {
      const history = await db.getHistory(200);
      set({ history, isHistoryLoading: false });
    } catch (error) {
      console.error(error);
      set({ isHistoryLoading: false, error: 'Failed to load history.' });
    }
  },

  processClipboard: async () => {
    if (get().isProcessing) {
      return;
    }

    set({ error: null, statusMessage: 'Accessing clipboard...' });

    try {
      const clipboardResult = await webAPI.getClipboardImage();

      if (!clipboardResult) {
        set({ error: 'No image found in clipboard.', statusMessage: '' });
        return;
      }

      const image: SourceImage = {
        filePath: clipboardResult.filePath,
        dataUrl: clipboardResult.dataUrl,
        width: clipboardResult.width,
        height: clipboardResult.height,
        origin: 'clipboard',
      };

      await processImage(image, set, get);
    } catch (error) {
      console.error(error);
      set({
        error: 'Failed to access clipboard. Please make sure you granted clipboard permissions.',
        statusMessage: '',
        isProcessing: false,
      });
    }
  },

  processFile: async (file: File) => {
    if (get().isProcessing) {
      return;
    }

    set({ error: null, statusMessage: 'Processing file...' });

    try {
      const fileResult = await webAPI.processFile(file);

      if (fileResult.type === 'pdf') {
        const pdfInfo = await getPdfInfo(fileResult.data);
        const rendered = await renderPdfFirstPage(fileResult.data);

        const { filePath } = await webAPI.saveDataUrl({
          dataUrl: rendered.dataUrl,
          prefix: 'pdf-page',
        });

        const image: SourceImage = {
          filePath,
          dataUrl: rendered.dataUrl,
          width: rendered.width,
          height: rendered.height,
          origin: 'pdf',
          pdfData: fileResult.data,
          currentPage: 1,
          totalPages: pdfInfo.pageCount,
        };

        await processImage(image, set, get);
      } else {
        const image: SourceImage = {
          filePath: fileResult.filePath,
          dataUrl: fileResult.dataUrl,
          origin: 'file',
        };

        await processImage(image, set, get);
      }
    } catch (error) {
      console.error(error);
      set({
        error: 'Failed to process file.',
        statusMessage: '',
        isProcessing: false,
      });
    }
  },

  rerunOCR: async () => {
    const current = get().sourceImage;
    if (!current || get().isProcessing) {
      return;
    }
    await processImage(current, set, get);
  },

  applyHistoryEntry: async (entry: HistoryEntry) => {
    try {
      const dataUrl = await webAPI.readFileDataUrl(entry.imagePath);
      const image: SourceImage = {
        filePath: entry.imagePath,
        dataUrl,
        origin: 'history',
      };
      set({
        sourceImage: image,
        processedImage: null,
        text: entry.textResult,
        confidence: entry.confidence,
        error: null,
      });
    } catch (error) {
      console.error(error);
      set({ error: 'Failed to open history image.' });
    }
  },

  deleteHistoryEntry: async (id: number) => {
    try {
      await db.deleteHistory(id);
      await get().refreshHistory();
    } catch (error) {
      console.error(error);
      set({ error: 'Failed to delete history.' });
    }
  },

  clearHistory: async () => {
    try {
      await db.clearHistory();
      set({ history: [] });
    } catch (error) {
      console.error(error);
      set({ error: 'Failed to clear history.' });
    }
  },

  updateSettings: async (patch: Partial<AppSettings>) => {
    try {
      const currentSettings = get().settings || DEFAULT_SETTINGS;
      const updated = { ...currentSettings, ...patch };
      saveSettings(updated);
      set({ settings: updated });
    } catch (error) {
      console.error(error);
      set({ error: 'Failed to update settings.' });
    }
  },

  setUserText: (value: string) => {
    set({ text: value });
  },

  clearAll: () => {
    set({
      sourceImage: null,
      processedImage: null,
      text: '',
      confidence: null,
      error: null,
      lastProcessedAt: null,
    });
  },

  changePdfPage: async (pageNumber: number) => {
    const current = get().sourceImage;
    if (!current || current.origin !== 'pdf' || !current.pdfData || !current.totalPages) {
      return;
    }

    if (pageNumber < 1 || pageNumber > current.totalPages) {
      set({ error: `Invalid page number: ${pageNumber}` });
      return;
    }

    if (pageNumber === current.currentPage) {
      return;
    }

    set({ isProcessing: true, error: null, statusMessage: `Loading page ${pageNumber}...` });

    try {
      const rendered = await renderPdfPage(current.pdfData, pageNumber);

      const { filePath } = await webAPI.saveDataUrl({
        dataUrl: rendered.dataUrl,
        prefix: 'pdf-page',
      });

      const updatedImage: SourceImage = {
        ...current,
        filePath,
        dataUrl: rendered.dataUrl,
        width: rendered.width,
        height: rendered.height,
        currentPage: pageNumber,
      };

      set({ sourceImage: updatedImage, statusMessage: `Page ${pageNumber} loaded` });
      await processImage(updatedImage, set, get);
    } catch (error) {
      console.error('Failed to change PDF page:', error);
      set({ error: 'Failed to load PDF page.', isProcessing: false });
    }
  },
}));

const processImage = async (
  image: SourceImage,
  set: (partial: Partial<RecognitionState>) => void,
  get: () => RecognitionState
) => {
  const settings = get().settings || DEFAULT_SETTINGS;

  set({
    sourceImage: image,
    processedImage: null,
    isProcessing: true,
    progress: 0,
    statusMessage: 'Running OCR…',
    error: null,
  });

  try {
    const result = await runOCR(image.dataUrl, settings.language, settings.psmMode);
    const normalizedText = normalizeText(result.text, settings.textNormalization);

    set({
      text: normalizedText,
      confidence: result.confidence,
      isProcessing: false,
      progress: 1,
      statusMessage: 'Completed',
      lastProcessedAt: Date.now(),
      sourceImage: image,
    });

    if (settings.autoCopy) {
      try {
        await webAPI.writeClipboardText(normalizedText);
      } catch (copyError) {
        console.warn('Failed to copy text', copyError);
      }
    }

    // Save to history
    const historyId = await db.addHistory({
      createdAt: new Date().toISOString(),
      imagePath: image.filePath,
      textResult: normalizedText,
      confidence: result.confidence,
      lang: settings.language,
      engine: 'tesseract-local',
    });

    // Refresh history to show the new entry
    await get().refreshHistory();
  } catch (error) {
    console.error(error);
    set({
      error: 'OCR processing failed.',
      isProcessing: false,
      statusMessage: '',
      progress: 0,
    });
  }
};
