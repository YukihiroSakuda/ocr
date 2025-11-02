'use client';

import * as pdfjs from 'pdfjs-dist';

let pdfWorkerReady = false;

const resolveAssetUrl = (relativePath: string) =>
  new URL(relativePath, typeof window === 'undefined' ? 'file://' : window.location.href).toString();

const loadPdfJs = async () => {
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

export interface PdfInfo {
  pageCount: number;
}

export const getPdfInfo = async (base64: string): Promise<PdfInfo> => {
  const pdfjs = await loadPdfJs();
  const pdfData = base64ToUint8Array(base64);
  const pdf = await pdfjs.getDocument({
    data: pdfData,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
    cMapPacked: true
  }).promise;
  const pageCount = pdf.numPages;
  pdf.cleanup();
  return { pageCount };
};

export const renderPdfPage = async (base64: string, pageNumber: number): Promise<PdfRenderResult> => {
  const pdfjs = await loadPdfJs();
  const pdfData = base64ToUint8Array(base64);
  const pdf = await pdfjs.getDocument({
    data: pdfData,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
    cMapPacked: true
  }).promise;

  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    pdf.cleanup();
    throw new Error(`Invalid page number: ${pageNumber}. PDF has ${pdf.numPages} pages.`);
  }

  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 2 });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas context could not be created for PDF rendering.');
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;

  const dataUrl = canvas.toDataURL('image/png');
  page.cleanup();
  pdf.cleanup();

  return {
    dataUrl,
    width: canvas.width,
    height: canvas.height
  };
};

export const renderPdfFirstPage = async (base64: string): Promise<PdfRenderResult> => {
  return renderPdfPage(base64, 1);
};
