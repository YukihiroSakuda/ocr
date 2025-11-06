# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Screenshot OCR App is a **web-based** application that extracts text from screenshots, images, and PDFs using client-side OCR processing (Tesseract.js). The app runs completely in the browser with no server dependencies - all processing, storage, and logic happens client-side.

**Tech Stack:**
- **Framework**: Next.js 15 (App Router) + React 19
- **Styling**: Tailwind CSS 4 with CSS custom properties
- **OCR Engine**: Tesseract.js (WASM) + OpenCV.js for image preprocessing
- **State Management**: Zustand for client state
- **Storage**: IndexedDB for history/images, localStorage for settings
- **Language**: TypeScript throughout
- **Deployment**: GitHub Pages (static export)

## Development Commands

### Running the App
```bash
# Install dependencies (root orchestrates renderer build)
npm install

# Start development server
npm run dev
# This runs: cd renderer && npm run dev
# Next.js dev server will start on http://localhost:3000
```

### Building
```bash
# Build for production
npm run build
# This runs: cd renderer && npm run build
# Output: renderer/.next/ (static export)
```

### Code Quality
```bash
# Lint code
npm run lint
# This runs: cd renderer && npm run lint
# Uses ESLint 9 with Next.js config
```

### Project Structure
The project has a simple structure:
- Root `package.json` is a thin wrapper that delegates to `renderer/`
- All actual code lives in `renderer/` directory
- When adding dependencies: `cd renderer && npm install <package>`
- Root scripts just forward to renderer scripts

## Architecture

### Directory Structure
```
ocr/
├── renderer/              # Next.js application (all code lives here)
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx      # Main OCR interface
│   │   ├── layout.tsx    # Root layout with global styles
│   │   └── globals.css   # CSS custom properties, theme
│   ├── components/       # React components
│   │   ├── UploadZone.tsx       # Initial screen with clipboard/file buttons
│   │   ├── ImagePreview.tsx     # Left pane: shows source image
│   │   ├── TextPanel.tsx        # Right pane: OCR result text
│   │   ├── PdfPageNavigator.tsx # PDF page navigation controls
│   │   ├── history/HistoryDrawer.tsx    # History sidebar
│   │   ├── settings/SettingsSheet.tsx   # Settings dialog
│   │   └── settings/LanguageOverlay.tsx # Language selection
│   ├── lib/              # Core business logic
│   │   ├── ocr.ts        # Tesseract worker, OpenCV preprocessing
│   │   ├── pdf.ts        # PDF.js rendering (multi-page support)
│   │   ├── web-api.ts    # Browser API wrappers (clipboard, file I/O)
│   │   ├── indexeddb.ts  # IndexedDB manager for history/images
│   │   └── languages.ts  # Language code utilities
│   ├── store/            # Zustand state management
│   │   └── app-store.ts  # Main application state
│   ├── types/            # TypeScript definitions
│   │   └── desktop.d.ts  # Shared type definitions
│   └── public/           # Static assets
│       └── tessdata/     # Tesseract language training data
└── .github/workflows/    # GitHub Actions for deployment
    └── deploy.yml        # Auto-deploy to GitHub Pages
```

### Data Flow

**Image Processing Flow:**
1. **User triggers OCR** (clipboard button / file select / drag & drop)
2. **Browser API** reads image data (Clipboard API / FileReader API)
3. **webAPI.ts** saves image to IndexedDB, returns data URL + file path
4. **app-store.ts** calls `processImage()` action
5. **ocr.ts** preprocesses image with OpenCV (WASM)
6. **ocr.ts** runs Tesseract OCR in Web Worker
7. **app-store.ts** normalizes text based on settings
8. **indexeddb.ts** persists result to history
9. **UI updates** with text result and confidence score

**PDF Processing Flow:**
1. User drops/selects PDF file
2. **pdf.ts** uses PDF.js to get metadata (page count)
3. **pdf.ts** renders page 1 as PNG image
4. Full PDF base64 stored in `SourceImage.pdfData` for navigation
5. OCR runs on rendered image
6. User can navigate pages → re-render → re-run OCR

### Storage Architecture

**IndexedDB** (`lib/indexeddb.ts`):
- **history** object store: OCR results with metadata
  - Schema: `{ id, createdAt, imagePath, textResult, engine, lang, confidence }`
  - Index on `createdAt` for chronological retrieval
- **images** object store: Image data URLs
  - Schema: `{ path, dataUrl, createdAt }`
  - Images stored as base64 data URLs
- **settings** object store: Key-value pairs (currently unused)

**localStorage** (`store/app-store.ts`):
- Settings stored as JSON under key `ocr-app-settings`
- Schema defined in `types/desktop.d.ts`
- Includes: language, autoCopy, autoProcessClipboard, textNormalization

### OCR Pipeline (`lib/ocr.ts`)

**1. Preprocessing** (`preprocessImage`):
- Convert to grayscale
- Gaussian blur (noise reduction)
- Histogram equalization (contrast enhancement)
- Adaptive thresholding (binarization)
- Optional deskewing via `minAreaRect`
- Invert if background is darker than foreground

**2. Recognition** (`runOCR`):
- Creates persistent Tesseract worker (reused across runs)
- Loads language on demand (default: `jpn+eng`)
- PSM mode: `SINGLE_BLOCK` with `preserve_interword_spaces`
- Returns `{ text, confidence }`

**3. Text Normalization** (`app-store.ts`):
- Remove line breaks (optional)
- Collapse whitespace (optional)
- Trim whitespace (optional)

### PDF Multi-Page Support (`lib/pdf.ts`)

**API:**
- `getPdfInfo(base64)` - Get PDF metadata (page count)
- `renderPdfPage(base64, pageNumber)` - Render specific page as PNG
- `renderPdfFirstPage(base64)` - Convenience wrapper for page 1

**Navigation:**
- PDF base64 stored in `SourceImage.pdfData`
- `PdfPageNavigator` component shows page controls
- `changePdfPage(pageNumber)` re-renders selected page and re-runs OCR
- Each rendered page saved to IndexedDB as separate image

## Key Conventions

### State Management
- Single Zustand store in `renderer/store/app-store.ts`
- All OCR processing logic lives in store actions
- Components are thin presentation layers
- Use `useShallow` selector for optimized re-renders

### Browser API Usage
- **Clipboard API**: `navigator.clipboard.read()` for images, `.writeText()` for text
- **FileReader API**: Convert File/Blob to data URLs
- **IndexedDB**: All persistent storage (history, images)
- **localStorage**: Settings only
- **Web Workers**: Tesseract runs in background thread
- **WASM**: OpenCV.js and Tesseract.js both use WebAssembly

### TypeScript Patterns
- Shared types in `renderer/types/desktop.d.ts`
- `AppSettings`, `HistoryEntry`, `HistoryInput` interfaces
- `SourceImage` type includes PDF navigation state
- No Electron types - pure web types only

### Styling
- **Design System**: Sharp tech-focused cyberpunk aesthetic with neon colors
- **Color Palette**:
  - Primary accent: Cyan (`#00ffff`)
  - Secondary accent: Pink (`#ff0080`) - used sparingly for highlights
  - Background: Pure black (`#000000`) with subtle gradients
- **Dark Mode Only**: App is locked to dark mode
- **CSS Architecture**: Tailwind v4 with CSS custom properties
- **Typography**: JetBrains Mono for monospace, Manrope for sans-serif
- All colors use semantic tokens via CSS variables (`--accent-base`, `--accent-pink`, `--surface`, etc.)
- Consistent use of sharp edges, no rounded corners, monospace fonts for tech aesthetic

### CSS Custom Properties
All colors defined in `renderer/app/globals.css`:
```css
--background: #000000;           /* Pure black */
--accent-base: #00ffff;          /* Cyan - primary accent */
--accent-pink: #ff0080;          /* Pink - secondary accent (use sparingly) */
--text-primary: #ffffff;         /* White text */
--text-secondary: rgba(255, 255, 255, 0.85);
--text-muted: rgba(255, 255, 255, 0.65);
--text-tertiary: rgba(255, 255, 255, 0.45);
--glow: 0 0 20px rgba(0, 255, 255, 0.3);      /* Cyan glow effect */
--glow-pink: 0 0 20px rgba(255, 0, 128, 0.4); /* Pink glow effect */
```

### Animation Patterns
- **Grid animations**: Moving grid backgrounds (`@keyframes moveGrid`)
- **Pulse effects**: Fading dots for processing (`@keyframes fadeIn`)
- **Staggered delays**: 0.2s intervals for sequential animations
- **Subtle motion**: 30s durations for ambient effects

## Common Development Tasks

### Adding New Language Support

1. **Download Tesseract training data:**
   - Get `.traineddata` files from https://github.com/naptha/tessdata
   - Place in `renderer/public/tessdata/`

2. **Update language options:**
   - Edit `renderer/lib/languages.ts`
   - Add language code and label to `LANGUAGE_OPTIONS`

3. **Test:**
   - Select language in settings
   - Verify OCR works with new language

### Modifying OCR Settings

- **Schema**: `renderer/types/desktop.d.ts` (AppSettings interface)
- **UI**: `renderer/components/settings/SettingsSheet.tsx`
- **Persistence**: `renderer/store/app-store.ts` (loadSettings/saveSettings)
- **Application**: `renderer/store/app-store.ts` (processImage function)

### Adding New Browser API Features

1. **Add wrapper in `renderer/lib/web-api.ts`:**
   ```typescript
   export async function yourFeature(): Promise<Result> {
     // Use browser APIs
     const data = await navigator.something.doThing();
     return processedData;
   }
   ```

2. **Call from store action in `renderer/store/app-store.ts`:**
   ```typescript
   yourAction: async () => {
     const result = await webAPI.yourFeature();
     set({ someState: result });
   }
   ```

3. **Connect to UI component**

### Debugging

- **Development mode**: Open http://localhost:3000
- **Browser DevTools**: Console for logs, Application tab for IndexedDB/localStorage
- **Network tab**: Check if Tesseract/OpenCV WASM files load correctly
- **React DevTools**: Inspect Zustand state and component re-renders
- **OCR progress**: Logged to console via `runOCR()` logger callback
- **Storage inspection**: Application → IndexedDB → ocr-app-db

## Important Notes

- **No server required**: Everything runs client-side in the browser
- **Data privacy**: Images and OCR results never leave the user's device
- **WASM loading**: OpenCV and Tesseract load asynchronously; proper timing handled
- **Clipboard permissions**: User must grant permission on first use
- **File drag & drop**: Native HTML5 drag & drop API used
- **PDF memory**: Full PDF kept in memory as base64 during session (consider cleanup for large PDFs)
- **Browser compatibility**: Requires modern browser with Clipboard API, IndexedDB, WASM support
- **Offline support**: After first load, app can work offline (service worker not yet implemented)
- **GitHub Pages deployment**: App is deployed via GitHub Actions to https://yukihirosakuda.github.io/ocr/
- **Static export**: Next.js configured for static export (no Node.js server needed)

## Deployment

The app auto-deploys to GitHub Pages when changes are pushed to `main`:

1. `.github/workflows/deploy.yml` runs on push
2. Builds Next.js app (`npm run build`)
3. Exports static files
4. Deploys to GitHub Pages
5. Available at: https://yukihirosakuda.github.io/ocr/

See `DEPLOY.md` for detailed deployment instructions and troubleshooting.
