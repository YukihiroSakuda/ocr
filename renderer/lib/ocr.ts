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

const getBasePath = () => {
  if (typeof window === 'undefined') return '';
  // Get the base path from the current URL
  const pathArray = window.location.pathname.split('/');
  // If running on GitHub Pages with /ocr/ path
  if (pathArray[1] === 'ocr') {
    return '/ocr';
  }
  return '';
};

const resolveAssetUrl = (relativePath: string) => {
  const basePath = getBasePath();
  const fullPath = basePath + relativePath;
  return new URL(fullPath, withWindow(() => window.location.origin, 'file://')).toString();
};

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
        legacyCore: true,  // Try legacy core for better accuracy
        legacyLang: false
      } satisfies Partial<WorkerOptions>)) as ExtendedWorker;

      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,  // Better for screenshots with sparse text
        preserve_interword_spaces: '1',
        // Japanese/CJK OCR optimization
        tessedit_char_blacklist: '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳',  // Prevent circled numbers
        tessedit_char_whitelist: '',
        language_model_ngram_on: '1',  // Enable language model for CJK
        textord_force_make_prop_words: '0',  // Don't force proportional word spacing
        edges_max_children_per_outline: '40',  // Increase for complex CJK characters
        textord_heavy_nr: '1',  // Heavy noise reduction
        textord_noise_sizefraction: '10',  // Aggressive noise filtering
        classify_enable_learning: '0',  // Disable adaptive learning (prevents wrong patterns)
        classify_enable_adaptive_matcher: '0'  // Use only trained data
      });

      currentLanguage = language;
      return worker;
    })();
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
  psmMode?: string,
  onProgress?: (progress: number, status?: string) => void
): Promise<OCRResult> => {
  const worker = await ensureWorker(language, onProgress);

  // Update PSM mode if provided
  if (psmMode) {
    const psmValue = (PSM as Record<string, number>)[psmMode];
    if (psmValue !== undefined) {
      await worker.setParameters({
        tessedit_pageseg_mode: psmValue
      });
    }
  }

  try {
    // Upscale small images for better recognition
    const upscaledInput = await upscaleIfNeeded(input);

    const { data } = await worker.recognize(upscaledInput);
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

// Sharpen image for better OCR (simple convolution filter)
const sharpenImage = (imageData: ImageData): ImageData => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new ImageData(width, height);

  // Sharpening kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB channels
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += data[idx] * kernel[kernelIdx];
          }
        }
        const outIdx = (y * width + x) * 4 + c;
        output.data[outIdx] = Math.min(255, Math.max(0, sum));
      }
      // Copy alpha channel
      const alphaIdx = (y * width + x) * 4 + 3;
      output.data[alphaIdx] = data[alphaIdx];
    }
  }

  return output;
};

// Upscale image if too small (Tesseract works best with larger images)
const upscaleIfNeeded = (dataUrl: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const img = await loadImageElement(dataUrl);
      const targetMinDimension = 1200; // Target minimum dimension for best OCR
      const absoluteMinDimension = 800; // Minimum before upscaling

      // If image is large enough, return as-is
      if (img.width >= targetMinDimension && img.height >= targetMinDimension) {
        resolve(dataUrl);
        return;
      }

      // Calculate scale factor (aim for targetMinDimension on smallest side)
      const minSide = Math.min(img.width, img.height);
      const scale = minSide < absoluteMinDimension
        ? targetMinDimension / minSide
        : Math.min(3, targetMinDimension / minSide);

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(img.width * scale);
      canvas.height = Math.floor(img.height * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Apply sharpening for better character edge detection
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const sharpened = sharpenImage(imageData);
      ctx.putImageData(sharpened, 0, 0);

      resolve(canvas.toDataURL('image/png'));
    } catch (error) {
      reject(error);
    }
  });
};

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
