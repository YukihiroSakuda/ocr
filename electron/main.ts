import { app, BrowserWindow, clipboard, dialog, ipcMain, nativeTheme, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import HistoryStore, { HistoryEntry, HistoryInput } from './storage/history';
import SettingsStore from './storage/settings';
import type { AppSettings } from './storage/settingsSchema';

const IS_DEV = process.env.NODE_ENV === 'development';
const DEV_URL = process.env.ELECTRON_RENDERER_URL ?? 'http://localhost:3000';

let mainWindow: BrowserWindow | null = null;

const PRELOAD_PATH = path.join(__dirname, 'preload.js');

const getRendererUrl = () => {
  if (IS_DEV) {
    return DEV_URL;
  }
  const indexPath = path.join(__dirname, '../renderer/index.html');
  return `file://${indexPath}`;
};

const ensureDir = (dir: string) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

const getDataDir = () => app.getPath('userData');
const getImageDir = () => path.join(getDataDir(), 'images');
const getHistoryDbPath = () => path.join(getDataDir(), 'ocr_history.db');

let historyStore!: HistoryStore;
let settingsStore!: SettingsStore;

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const createWindow = async () => {
  ensureDir(getImageDir());

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1F2937' : '#F9FAFB',
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  const url = getRendererUrl();
  await mainWindow.loadURL(url);

};

const createId = () => randomUUID().replace(/-/g, '').slice(0, 10);

const convertNativeImage = async () => {
  const image = clipboard.readImage();
  if (image.isEmpty()) {
    return null;
  }

  const buffer = image.toPNG();
  const dataUrl = image.toDataURL();
  const fileName = `clipboard-${Date.now()}-${createId()}.png`;
  const filePath = path.join(getImageDir(), fileName);
  await fs.writeFile(filePath, buffer);

  return {
    filePath,
    dataUrl,
    width: image.getSize().width,
    height: image.getSize().height
  };
};

const copyImageToStore = async (source: string) => {
  const ext = path.extname(source) || '.png';
  const fileName = `import-${Date.now()}-${createId()}${ext}`;
  const destination = path.join(getImageDir(), fileName);
  await fs.copyFile(source, destination);
  let dataUrl: string | null = null;
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'].includes(ext.toLowerCase())) {
    try {
      const buffer = await fs.readFile(destination);
      const base64 = buffer.toString('base64');
      const mime =
        ext === '.jpg' || ext === '.jpeg'
          ? 'image/jpeg'
          : ext === '.webp'
            ? 'image/webp'
            : ext === '.gif'
              ? 'image/gif'
              : ext === '.bmp'
                ? 'image/bmp'
                : 'image/png';
      dataUrl = `data:${mime};base64,${base64}`;
    } catch (error) {
      console.error('Failed to create data URL for imported image', error);
    }
  }
  return { filePath: destination, dataUrl };
};

const removeImageFile = (filePath: string) => {
  try {
    if (existsSync(filePath)) {
      rmSync(filePath, { force: true });
    }
  } catch (error) {
    console.warn('Failed to remove image file', error);
  }
};

const registerIpcHandlers = () => {
  ipcMain.handle('app:get-info', () => ({
    version: app.getVersion()
  }));

  ipcMain.handle('settings:get', () => {
    const settings = settingsStore.getSettings();
    nativeTheme.themeSource = settings.theme;
    return settings;
  });

  ipcMain.handle('settings:update', (_event, partial: Partial<AppSettings>) => {
    const updated = settingsStore.updateSettings(partial);
    nativeTheme.themeSource = updated.theme;
    historyStore.setMaxEntries(updated.maxHistoryItems);
    return updated;
  });

  ipcMain.handle('clipboard:get-image', async () => {
    const image = await convertNativeImage();
    if (!image) return null;
    return image;
  });

  ipcMain.handle('clipboard:write-text', (_event, text: string) => {
    clipboard.writeText(text);
    return true;
  });

  ipcMain.handle('file:open-image', async () => {
    const result = await dialog.showOpenDialog({
      filters: [
        {
          name: 'Images & PDF',
          extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tif', 'tiff', 'pdf']
        }
      ],
      properties: ['openFile']
    });

    if (result.canceled || !result.filePaths.length) {
      return null;
    }

    const filePath = result.filePaths[0];
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      const buffer = await fs.readFile(filePath);
      return {
        type: 'pdf' as const,
        filePath,
        data: buffer.toString('base64')
      };
    }

    const { filePath: storedPath, dataUrl } = await copyImageToStore(filePath);
    return {
      type: 'image' as const,
      filePath: storedPath,
      dataUrl
    };
  });

  ipcMain.handle('file:save-data-url', async (_event, payload: { dataUrl: string; prefix?: string }) => {
    const { dataUrl, prefix = 'generated' } = payload;
    const matches = /^data:(.+);base64,(.+)$/.exec(dataUrl);
    if (!matches) {
      throw new Error('Invalid data URL');
    }
    const [, mime, base64] = matches;
    const buffer = Buffer.from(base64, 'base64');
    const ext =
      mime === 'image/jpeg'
        ? '.jpg'
        : mime === 'image/webp'
          ? '.webp'
          : mime === 'image/gif'
            ? '.gif'
            : '.png';
    const fileName = `${prefix}-${Date.now()}-${createId()}${ext}`;
    const filePath = path.join(getImageDir(), fileName);
    await fs.writeFile(filePath, buffer);
    return { filePath };
  });

  ipcMain.handle('file:read-data-url', async (_event, sourcePath: string) => {
    const buffer = await fs.readFile(sourcePath);
    const ext = path.extname(sourcePath).toLowerCase();
    const mime =
      ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.webp'
          ? 'image/webp'
          : ext === '.gif'
            ? 'image/gif'
            : ext === '.bmp'
              ? 'image/bmp'
              : 'image/png';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  });

  ipcMain.handle('history:list', () => historyStore.getEntries());

  ipcMain.handle('history:save', (_event, entry: HistoryInput) => {
    const saved = historyStore.addEntry(entry);
    mainWindow?.webContents.send('history:updated');
    return saved;
  });

  ipcMain.handle('history:delete', (_event, id: number) => {
    const entry = historyStore.getEntry(id);
    historyStore.deleteEntry(id);
    if (entry) {
      removeImageFile(entry.imagePath);
    }
    mainWindow?.webContents.send('history:updated');
    return true;
  });

  ipcMain.handle('history:clear', () => {
    const entries = historyStore.getEntries();
    for (const item of entries) {
      removeImageFile(item.imagePath);
    }
    historyStore.clear();
    mainWindow?.webContents.send('history:updated');
    return true;
  });

  ipcMain.handle('history:purge-image', (_event, imagePath: string) => {
    removeImageFile(imagePath);
    return true;
  });

  ipcMain.handle('shell:open-path', (_event, targetPath: string) => {
    shell.openPath(targetPath);
    return true;
  });
};

app.whenReady().then(async () => {
  historyStore = new HistoryStore(getHistoryDbPath(), 200);
  settingsStore = new SettingsStore(getDataDir());
  historyStore.setMaxEntries(settingsStore.getSettings().maxHistoryItems);
  ensureDir(getImageDir());
  registerIpcHandlers();
  nativeTheme.themeSource = settingsStore.getSettings().theme;
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
