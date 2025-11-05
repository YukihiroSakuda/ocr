// IndexedDB wrapper for OCR history and image storage

const DB_NAME = 'ocr-app-db';
const DB_VERSION = 1;
const HISTORY_STORE = 'history';
const IMAGES_STORE = 'images';
const SETTINGS_STORE = 'settings';

export interface HistoryEntry {
  id: number;
  createdAt: string;
  imagePath: string;
  textResult: string;
  engine: string;
  lang: string;
  confidence: number | null;
}

export interface ImageData {
  path: string;
  dataUrl: string;
  createdAt: string;
}

export interface SettingsData {
  key: string;
  value: unknown;
}

class IndexedDBManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create history object store
        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
          const historyStore = db.createObjectStore(HISTORY_STORE, {
            keyPath: 'id',
            autoIncrement: true,
          });
          historyStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create images object store
        if (!db.objectStoreNames.contains(IMAGES_STORE)) {
          const imagesStore = db.createObjectStore(IMAGES_STORE, {
            keyPath: 'path',
          });
          imagesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create settings object store
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        }
      };
    });

    return this.dbPromise;
  }

  // History methods
  async addHistory(entry: Omit<HistoryEntry, 'id'>): Promise<number> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(HISTORY_STORE);
      const request = store.add(entry);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getHistory(limit = 200): Promise<HistoryEntry[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([HISTORY_STORE], 'readonly');
      const store = transaction.objectStore(HISTORY_STORE);
      const index = store.index('createdAt');
      const request = index.openCursor(null, 'prev');
      const results: HistoryEntry[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && results.length < limit) {
          const value = cursor.value as HistoryEntry;
          if (value.id !== undefined) {
            results.push(value);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteHistory(id: number): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(HISTORY_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearHistory(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(HISTORY_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Image methods
  async saveImage(image: ImageData): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMAGES_STORE], 'readwrite');
      const store = transaction.objectStore(IMAGES_STORE);
      const request = store.put(image);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getImage(path: string): Promise<ImageData | undefined> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMAGES_STORE], 'readonly');
      const store = transaction.objectStore(IMAGES_STORE);
      const request = store.get(path);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteImage(path: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMAGES_STORE], 'readwrite');
      const store = transaction.objectStore(IMAGES_STORE);
      const request = store.delete(path);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Settings methods (using key-value pairs)
  async saveSetting(key: string, value: unknown): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key: string): Promise<unknown | undefined> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : undefined);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new IndexedDBManager();
