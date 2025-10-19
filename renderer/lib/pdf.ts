'use client';

let pdfModulePromise: Promise<typeof import('pdfjs-dist')> | null = null;
let pdfWorkerReady = false;

const resolveAssetUrl = (relativePath: string) =>
  new URL(relativePath, typeof window === 'undefined' ? 'file://' : window.location.href).toString();

const loadPdfJs = async () => {
  if (!pdfModulePromise) {
    pdfModulePromise = import('pdfjs-dist');
  }
  const pdfjs = await pdfModulePromise;
  if (!pdfWorkerReady) {
    pdfjs.GlobalWorkerOptions.workerSrc = resolveAssetUrl('/pdf.worker.min.mjs');
    pdfWorkerReady = true;
  }
  return pdfjs;
};

const base64ToUint8Array = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export interface PdfRenderResult {
  dataUrl: string;
  width: number;
  height: number;
}

export const renderPdfFirstPage = async (base64: string): Promise<PdfRenderResult> => {
  const pdfjs = await loadPdfJs();
  const pdfData = base64ToUint8Array(base64);
  const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
  const firstPage = await pdf.getPage(1);
  const viewport = firstPage.getViewport({ scale: 2 });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas context could not be created for PDF rendering.');
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await firstPage.render({ canvasContext: context, viewport }).promise;

  const dataUrl = canvas.toDataURL('image/png');
  firstPage.cleanup();
  pdf.cleanup();

  return {
    dataUrl,
    width: canvas.width,
    height: canvas.height
  };
};
