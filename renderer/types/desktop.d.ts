export interface TextNormalizationSetting {
  trimWhitespace: boolean;
  collapseWhitespace: boolean;
  removeLineBreaks: boolean;
}

export interface AppSettings {
  language: string;
  autoCopy: boolean;
  autoProcessClipboard: boolean;
  textNormalization: TextNormalizationSetting;
}

export interface HistoryEntry {
  id: number;
  createdAt: string;
  imagePath: string;
  textResult: string;
  engine: string;
  lang: string;
  confidence: number | null;
}

export interface HistoryInput {
  imagePath: string;
  textResult: string;
  engine?: string;
  lang?: string;
  confidence?: number | null;
}

export type ImageDialogResult =
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

export interface ClipboardImageResult {
  filePath: string;
  dataUrl: string;
  width: number;
  height: number;
}

export interface DesktopAPI {
  getAppInfo(): Promise<{ version: string }>;
  getSettings(): Promise<AppSettings>;
  updateSettings(partial: Partial<AppSettings>): Promise<AppSettings>;
  getClipboardImage(): Promise<ClipboardImageResult | null>;
  writeClipboardText(text: string): Promise<boolean>;
  openImageDialog(): Promise<ImageDialogResult | null>;
  processDroppedFile(filePath: string): Promise<ImageDialogResult | null>;
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

declare global {
  interface Window {
    desktopAPI: DesktopAPI;
  }
}

export {};
