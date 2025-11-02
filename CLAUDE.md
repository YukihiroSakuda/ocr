# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Screenshot OCR App is an Electron-based desktop application that extracts text from screenshots, images, and PDFs using local OCR processing (Tesseract.js). The app runs completely offline with no cloud dependencies.

**Tech Stack:**
- **Frontend**: Next.js 15 (App Router) + React 19 + Tailwind CSS 4
- **Desktop**: Electron 31 (Main/Preload/Renderer architecture)
- **OCR**: Tesseract.js + OpenCV.js for image preprocessing
- **State**: Zustand for client state management
- **Storage**: better-sqlite3 for history persistence
- **Language**: TypeScript throughout

## Development Commands

### Running the App
```bash
# Development mode (runs all 3 processes concurrently)
npm run dev

# What this does:
# 1. renderer:dev - Next.js dev server on port 3000
# 2. electron:watch - TypeScript compiler in watch mode for Electron main process
# 3. electron:start - Launches Electron once Next.js and main.js are ready
```

### Building
```bash
# Build everything for production
npm run build

# Individual build steps:
npm run renderer:build    # Build Next.js app
npm run renderer:export   # Export to static HTML
npm run electron:build    # Compile TypeScript for Electron

# Package distributable
npm run package  # Creates installer in dist/ directory
```

### Code Quality
```bash
# Lint renderer code (uses ESLint 9)
npm run lint
# or
npm run renderer:lint
```

### Cleanup
```bash
# Remove all build artifacts
npm run clean
```

### Working in Subdirectories
The project has a monorepo-like structure:
- Root `package.json` orchestrates Electron + renderer builds
- `renderer/` directory has its own `package.json` for Next.js dependencies
- When adding renderer dependencies: `cd renderer && npm install <package>`
- When adding Electron dependencies: `npm install <package>` (in root)

## Architecture

### Project Structure
```
ocr/
├── electron/              # Electron main process code
│   ├── main.ts           # Entry point, window creation, IPC handlers
│   ├── preload.ts        # Context bridge exposing desktopAPI to renderer
│   └── storage/          # Data persistence layer
│       ├── history.ts    # SQLite-based OCR history management
│       ├── settings.ts   # App settings persistence
│       └── settingsSchema.ts  # Settings type definitions
├── renderer/             # Next.js frontend (runs in Electron renderer)
│   ├── app/             # Next.js App Router pages
│   │   ├── page.tsx     # Main OCR interface
│   │   └── layout.tsx   # Root layout with global styles
│   ├── components/      # React components
│   │   ├── ImagePreview.tsx    # Left pane: shows source/processed image
│   │   ├── TextPanel.tsx       # Right pane: OCR result text
│   │   ├── ActionBar.tsx       # Bottom toolbar with action buttons
│   │   ├── history/HistoryDrawer.tsx  # History sidebar
│   │   └── settings/SettingsSheet.tsx # Settings dialog
│   ├── lib/             # Core business logic
│   │   ├── ocr.ts       # Tesseract worker, OpenCV preprocessing
│   │   └── pdf.ts       # PDF first-page rendering
│   ├── store/           # Zustand state management
│   │   └── app-store.ts # Main application state
│   └── types/           # TypeScript type definitions
│       └── desktop.d.ts # Window.desktopAPI type declarations
└── dist-electron/       # Compiled Electron code (gitignored)
└── renderer/out/        # Exported Next.js static files (gitignored)
```

### Electron Process Architecture

**Main Process (`electron/main.ts`):**
- Creates BrowserWindow and loads renderer HTML
- Registers IPC handlers for file system, clipboard, history, settings
- Manages SQLite database and image storage in `userData` directory
- Handles image file lifecycle (save clipboard images, cleanup on delete)

**Preload Script (`electron/preload.ts`):**
- Exposes `window.desktopAPI` to renderer via `contextBridge`
- Type-safe bridge between renderer and main process
- All IPC communication flows through this API

**Renderer Process (`renderer/`):**
- Next.js app running in Electron's BrowserWindow
- Uses `window.desktopAPI` to interact with Electron features
- Completely client-side rendered (Next.js export mode)

### Data Flow

1. **User triggers OCR** (clipboard button / file dialog / drag & drop)
2. **Renderer** calls `desktopAPI.getClipboardImage()`, `desktopAPI.openImageDialog()`, or `desktopAPI.processDroppedFile(filePath)`
3. **Main process** returns image data URL + file path
4. **Renderer** runs OpenCV preprocessing in browser (WASM)
5. **Renderer** runs Tesseract OCR in Web Worker
6. **Renderer** calls `desktopAPI.saveHistory()` with results
7. **Main process** persists to SQLite, broadcasts `history:updated` event
8. **Renderer** refreshes history list via IPC listener

### OCR Pipeline (`renderer/lib/ocr.ts`)

1. **Preprocessing** (`preprocessImage`):
   - Convert to grayscale
   - Gaussian blur (reduce noise)
   - Histogram equalization (enhance contrast)
   - Adaptive thresholding (binarization)
   - Optional deskewing via `minAreaRect`
   - Invert if background is darker than foreground

2. **Recognition** (`runOCR`):
   - Uses persistent Tesseract worker (reused across OCR runs)
   - Language loaded on demand (default: `jpn+eng`)
   - PSM mode: `SINGLE_BLOCK` with `preserve_interword_spaces`
   - Returns `{ text, confidence }`

3. **Text Normalization** (`app-store.ts`):
   - Remove line breaks (optional)
   - Collapse whitespace (optional)
   - Trim (optional)

### Storage Schema

**SQLite Table** (`electron/storage/history.ts`):
```sql
CREATE TABLE history (
  id INTEGER PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now')),
  image_path TEXT NOT NULL,  -- Absolute path in userData/images/
  text_result TEXT NOT NULL,
  engine TEXT DEFAULT 'local',
  lang TEXT DEFAULT 'jpn+eng',
  confidence REAL
)
```

**Settings** (`electron/storage/settings.ts`):
- Stored as JSON file in `userData/settings.json`
- Schema defined in `settingsSchema.ts`
- Includes: language, theme, text normalization options, auto behaviors

**Image Files**:
- Saved in `userData/images/` directory
- Naming: `clipboard-{timestamp}-{id}.png` or `import-{timestamp}-{id}.{ext}`
- Automatically deleted when history entry is removed

## Key Conventions

### IPC Handler Naming
- Pattern: `{domain}:{action}` (e.g., `clipboard:get-image`, `history:save`)
- Main process registers handlers in `registerIpcHandlers()`
- Renderer invokes via `ipcRenderer.invoke(channel, ...args)`
- Events use same namespace (e.g., `history:updated` broadcast)

### State Management
- Single Zustand store in `renderer/store/app-store.ts`
- All OCR processing logic lives in store actions
- Components are thin presentation layers
- Use `useShallow` selector for optimized re-renders

### TypeScript Patterns
- Shared types exported from `electron/preload.ts` (HistoryEntry, AppSettings)
- Renderer types in `renderer/types/desktop.d.ts` augment `Window` interface
- Main process types in `electron/storage/` for database models

### Styling
- Tailwind v4 with CSS variables for theming
- Dark mode via `data-theme` attribute on `<html>`
- Theme controlled by settings store + `applyTheme()` in page.tsx
- All colors use semantic tokens (`primary`, `accent`, `surface`)

## Common Development Tasks

### Adding New IPC Handlers

1. **Define handler in `electron/main.ts`:**
   ```typescript
   ipcMain.handle('your:action', async (_event, arg) => {
     // your logic
     return result;
   });
   ```

2. **Add to preload API in `electron/preload.ts`:**
   ```typescript
   export interface DesktopAPI {
     yourAction(arg: string): Promise<Result>;
   }
   const desktopAPI: DesktopAPI = {
     yourAction: (arg) => ipcRenderer.invoke('your:action', arg)
   };
   ```

3. **Use in renderer:**
   ```typescript
   const result = await window.desktopAPI.yourAction('foo');
   ```

### Modifying OCR Settings

- Schema: `electron/storage/settingsSchema.ts`
- UI: `renderer/components/settings/SettingsSheet.tsx`
- Persistence: `electron/storage/settings.ts`
- Application: `renderer/store/app-store.ts` (in `processImage` function)

### Adding Tesseract Languages

1. Download `.traineddata` files to `renderer/public/tessdata/`
2. Update `settingsSchema.ts` language options
3. Ensure correct `langPath` in `renderer/lib/ocr.ts` (already set to `/tessdata`)

### Debugging

- **Development mode**: Electron opens with DevTools detached
- **Main process logs**: Check terminal running `npm run dev`
- **Renderer logs**: Check DevTools Console
- **IPC tracing**: Add `console.log` in preload or main IPC handlers
- **OCR progress**: Tracked via `logger` callback in `ocr.ts`

## Important Notes

- **File paths**: All paths in Electron APIs are absolute, never relative
- **Data URLs**: Images pass between processes as base64 data URLs
- **Worker lifecycle**: Tesseract worker is created once and reused (don't terminate)
- **OpenCV loading**: WASM module loads asynchronously; `waitForOpenCV()` handles timing
- **SQLite transactions**: better-sqlite3 is synchronous; no async needed
- **History limits**: Enforced automatically via `setMaxEntries()` after each insert
- **Theme persistence**: Settings store syncs with `nativeTheme.themeSource` in main process
- **Drag & drop**: In Electron, File objects have a `path` property that provides absolute file paths. Type it as `File & { path: string }` to avoid TypeScript errors
- **Drag overlay**: Visual feedback is shown via `isDragging` state when files are dragged over the main element
