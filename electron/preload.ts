import { contextBridge, ipcRenderer } from 'electron';
import type { HistoryEntry, HistoryInput } from './storage/history';
import type { AppSettings } from './storage/settingsSchema';

type ImageResult =
  | {
      type: 'image';
      filePath: string;
      dataUrl: string | null;
    }
  | {
      type: 'pdf';
      filePath: string;
      data: string;
    };

type ClipboardImageResult =
  | {
      filePath: string;
      dataUrl: string;
      width: number;
      height: number;
    }
  | null;

export interface DesktopAPI {
  getAppInfo(): Promise<{ version: string }>;
  getSettings(): Promise<AppSettings>;
  updateSettings(partial: Partial<AppSettings>): Promise<AppSettings>;
  getClipboardImage(): Promise<ClipboardImageResult>;
  writeClipboardText(text: string): Promise<boolean>;
  openImageDialog(): Promise<ImageResult | null>;
  processDroppedFile(filePath: string): Promise<ImageResult | null>;
  saveDataUrl(payload: { dataUrl: string; prefix?: string }): Promise<{ filePath: string }>;
  readFileDataUrl(path: string): Promise<string>;
  listHistory(): Promise<HistoryEntry[]>;
  saveHistory(entry: HistoryInput): Promise<HistoryEntry>;
  deleteHistory(id: number): Promise<boolean>;
  clearHistory(): Promise<boolean>;
  purgeHistoryImage(path: string): Promise<boolean>;
  onHistoryUpdated(callback: () => void): () => void;
  openPath(target: string): Promise<boolean>;
}

const desktopAPI: DesktopAPI = {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (partial) => ipcRenderer.invoke('settings:update', partial),
  getClipboardImage: () => ipcRenderer.invoke('clipboard:get-image'),
  writeClipboardText: (text) => ipcRenderer.invoke('clipboard:write-text', text),
  openImageDialog: () => ipcRenderer.invoke('file:open-image'),
  processDroppedFile: (filePath) => ipcRenderer.invoke('file:process-dropped', filePath),
  saveDataUrl: (payload) => ipcRenderer.invoke('file:save-data-url', payload),
  readFileDataUrl: (path) => ipcRenderer.invoke('file:read-data-url', path),
  listHistory: () => ipcRenderer.invoke('history:list'),
  saveHistory: (entry) => ipcRenderer.invoke('history:save', entry),
  deleteHistory: (id) => ipcRenderer.invoke('history:delete', id),
  clearHistory: () => ipcRenderer.invoke('history:clear'),
  purgeHistoryImage: (path) => ipcRenderer.invoke('history:purge-image', path),
  onHistoryUpdated: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('history:updated', handler);
    return () => ipcRenderer.removeListener('history:updated', handler);
  },
  openPath: (target) => ipcRenderer.invoke('shell:open-path', target)
};

contextBridge.exposeInMainWorld('desktopAPI', desktopAPI);

export type { HistoryEntry, HistoryInput, AppSettings };
