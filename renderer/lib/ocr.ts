'use client';

import {
  createWorker,
  PSM,
  type LoggerMessage,
  type Worker,
  type WorkerOptions
} from 'tesseract.js';

type ExtendedWorker = Worker & {
  loadLanguage: (langs: string) => Promise<unknown>;
  initialize: (langs: string) => Promise<unknown>;
};

type OpenCVModule = typeof import('@techstark/opencv-js');
type OpenCVMat = InstanceType<OpenCVModule['Mat']>;

let workerPromise: Promise<ExtendedWorker> | null = null;
let currentLanguage = '';
let progressHandler: ((progress: number, status?: string) => void) | null = null;

const withWindow = <T>(factory: () => T, fallback: T) => {
  if (typeof window === 'undefined') {
    return fallback;
  }
  return factory();
};

const resolveAssetUrl = (relativePath: string) =>
  new URL(relativePath, withWindow(() => window.location.href, 'file://')).toString();

const ensureWorker = async (
  language: string,
  onProgress?: (progress: number, status?: string) => void
): Promise<ExtendedWorker> => {
  if (onProgress) {
    progressHandler = onProgress;
  }

  if (!workerPromise || currentLanguage !== language) {
    // Terminate old worker if language changed
    if (workerPromise && currentLanguage !== language) {
      const oldWorker = await workerPromise;
      await oldWorker.terminate();
      workerPromise = null;
    }

    console.log('[OCR] Creating worker with language:', language);
    workerPromise = (async () => {
      const worker = (await createWorker(language, undefined, {
        workerPath: resolveAssetUrl('/tesseract/worker.min.js'),
        corePath: resolveAssetUrl('/tesseract'),
        langPath: resolveAssetUrl('/tessdata'),
        gzip: false,
        logger: (message: LoggerMessage) => {
          if (message.progress && progressHandler) {
            progressHandler(message.progress, message.status);
          }
        },
        legacyCore: false,
        legacyLang: false
      } satisfies Partial<WorkerOptions>)) as ExtendedWorker;

      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        preserve_interword_spaces: '1'
      });

      currentLanguage = language;
      console.log('[OCR] Worker initialized successfully with language:', language);
      return worker;
    })();
  } else {
    console.log('[OCR] Using cached worker for language:', currentLanguage);
  }

  return await workerPromise;
};

export interface OCRResult {
  text: string;
  confidence: number;
}

export const runOCR = async (
  input: string,
  language: string,
  onProgress?: (progress: number, status?: string) => void
): Promise<OCRResult> => {
  console.log('[OCR] Starting OCR with language:', language);
  const worker = await ensureWorker(language, onProgress);
  try {
    const { data } = await worker.recognize(input);
    console.log('[OCR] OCR completed. Confidence:', data.confidence, 'Text length:', data.text.length);
    return {
      text: data.text,
      confidence: data.confidence
    };
  } finally {
    progressHandler = null;
  }
};

let cvPromise: Promise<OpenCVModule> | null = null;

const waitForOpenCV = async (): Promise<OpenCVModule> => {
  if (!cvPromise) {
    cvPromise = new Promise<OpenCVModule>(async (resolve, reject) => {
      try {
        await import('@techstark/opencv-js');
      } catch (error) {
        reject(error);
        return;
      }

      const start = performance.now();
      const timeoutMs = 30000; // Increased from 5s to 30s

      const check = () => {
        const cvCandidate = (window as unknown as { cv?: OpenCVModule }).cv;
        if (cvCandidate && typeof cvCandidate.imread === 'function') {
          console.log('[OpenCV] Initialized successfully in', Math.round(performance.now() - start), 'ms');
          resolve(cvCandidate);
        } else if (performance.now() - start > timeoutMs) {
          reject(new Error('OpenCV runtime initialization timed out.'));
        } else {
          requestAnimationFrame(check);
        }
      };

      check();
    });
  }
  return cvPromise;
};

const loadImageElement = (dataUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    img.src = dataUrl;
  });

export interface PreprocessOptions {
  deskew?: boolean;
}

export interface PreprocessResult {
  dataUrl: string;
  width: number;
  height: number;
}

export const preprocessImage = async (
  dataUrl: string,
  options: PreprocessOptions = {}
): Promise<PreprocessResult> => {
  try {
    const cv = await waitForOpenCV();
    const image = await loadImageElement(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas not supported');
    }
    ctx.drawImage(image, 0, 0);

    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0);

    const enhanced = new cv.Mat();
    cv.equalizeHist(blurred, enhanced);

    const binary = new cv.Mat();
    cv.adaptiveThreshold(
      enhanced,
      binary,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      25,
      10
    );

    let outputMat: OpenCVMat | null = null;

    if (options.deskew) {
      const coordinates = new cv.Mat();
      cv.bitwise_not(binary, binary);
      cv.findNonZero(binary, coordinates);
      if (coordinates.rows > 0) {
        const rotatedRect = cv.minAreaRect(coordinates);
        const angle = rotatedRect.angle;
        const rotationMatrix = cv.getRotationMatrix2D(
          new cv.Point(canvas.width / 2, canvas.height / 2),
          angle,
          1
        );
        const rotated = new cv.Mat();
        cv.warpAffine(binary, rotated, rotationMatrix, new cv.Size(canvas.width, canvas.height), cv.INTER_LINEAR);
        cv.imshow(canvas, rotated);
        outputMat = rotated;
        rotationMatrix.delete();
      } else {
        cv.bitwise_not(binary, binary);
        cv.imshow(canvas, binary);
        outputMat = binary.clone();
      }
      coordinates.delete();
    } else {
      cv.imshow(canvas, binary);
      outputMat = binary.clone();
    }

    if (outputMat) {
      const mean = cv.mean(outputMat)[0];
      if (mean < 127) {
        const inverted = new cv.Mat();
        cv.bitwise_not(outputMat, inverted);
        cv.imshow(canvas, inverted);
        outputMat.delete();
        outputMat = inverted;
      }
    }

    const processedDataUrl = canvas.toDataURL('image/png');

    src.delete();
    gray.delete();
    blurred.delete();
    enhanced.delete();
    binary.delete();
    if (outputMat) {
      outputMat.delete();
    }

    return {
      dataUrl: processedDataUrl,
      width: canvas.width,
      height: canvas.height
    };
  } catch (error) {
    console.warn('OpenCV preprocessing failed, falling back to raw image.', error);
    const img = await loadImageElement(dataUrl);
    return {
      dataUrl,
      width: img.width,
      height: img.height
    };
  }
};
