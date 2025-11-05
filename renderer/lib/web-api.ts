// Web API wrappers for clipboard and file operations

import { db } from './indexeddb';
import type { ImageData } from './indexeddb';

export interface ClipboardImageResult {
  filePath: string;
  dataUrl: string;
  width?: number;
  height?: number;
}

export interface FileImageResult {
  type: 'image';
  filePath: string;
  dataUrl: string;
}

export interface FilePdfResult {
  type: 'pdf';
  filePath: string;
  data: string;
}

export type ImageDialogResult = FileImageResult | FilePdfResult | null;

// Generate unique file path for storing images
function generateFilePath(prefix: string = 'image'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

// Convert File to data URL
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Convert File to base64 string
async function fileToBase64(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  return dataUrl;
}

// Get image dimensions
async function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Clipboard operations
export async function getClipboardImage(): Promise<ClipboardImageResult | null> {
  try {
    const clipboardItems = await navigator.clipboard.read();

    for (const item of clipboardItems) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type);
          const dataUrl = await fileToDataUrl(new File([blob], 'clipboard.png', { type }));
          const dimensions = await getImageDimensions(dataUrl);
          const filePath = generateFilePath('clipboard');

          // Save to IndexedDB
          await db.saveImage({
            path: filePath,
            dataUrl,
            createdAt: new Date().toISOString(),
          });

          return {
            filePath,
            dataUrl,
            ...dimensions,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.warn('Clipboard read failed:', error);
    return null;
  }
}

export async function writeClipboardText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Failed to write to clipboard:', error);
    throw error;
  }
}

// File operations
export async function processFile(file: File): Promise<FileImageResult | FilePdfResult> {
  const filePath = generateFilePath(file.name.replace(/\.[^.]+$/, ''));

  if (file.type === 'application/pdf') {
    const base64 = await fileToBase64(file);
    return {
      type: 'pdf',
      filePath,
      data: base64,
    };
  }

  if (file.type.startsWith('image/')) {
    const dataUrl = await fileToDataUrl(file);

    // Save to IndexedDB
    await db.saveImage({
      path: filePath,
      dataUrl,
      createdAt: new Date().toISOString(),
    });

    return {
      type: 'image',
      filePath,
      dataUrl,
    };
  }

  throw new Error(`Unsupported file type: ${file.type}`);
}

// Read file data URL from IndexedDB
export async function readFileDataUrl(filePath: string): Promise<string> {
  const imageData = await db.getImage(filePath);
  if (!imageData) {
    throw new Error(`Image not found: ${filePath}`);
  }
  return imageData.dataUrl;
}

// Save data URL to IndexedDB
export async function saveDataUrl(params: {
  dataUrl: string;
  prefix?: string;
}): Promise<{ filePath: string }> {
  const filePath = generateFilePath(params.prefix || 'image');

  await db.saveImage({
    path: filePath,
    dataUrl: params.dataUrl,
    createdAt: new Date().toISOString(),
  });

  return { filePath };
}
