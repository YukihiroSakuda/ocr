import fs from 'node:fs';
import path from 'node:path';
import { AppSettings, DEFAULT_SETTINGS, mergeSettings, validateSettings } from './settingsSchema';

export default class SettingsStore {
  private filePath: string;
  private cache: AppSettings;

  constructor(baseDir: string) {
    const directory = path.resolve(baseDir);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    this.filePath = path.join(directory, 'preferences.json');
    this.cache = DEFAULT_SETTINGS;
    this.load();
  }

  private load() {
    if (!fs.existsSync(this.filePath)) {
      this.persist(this.cache);
      return;
    }

    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      this.cache = validateSettings({ ...DEFAULT_SETTINGS, ...parsed });
    } catch (error) {
      console.warn('Failed to load settings file, falling back to defaults.', error);
      this.cache = DEFAULT_SETTINGS;
      this.persist(this.cache);
    }
  }

  private persist(settings: AppSettings) {
    fs.writeFileSync(this.filePath, JSON.stringify(settings, null, 2), 'utf-8');
  }

  getSettings(): AppSettings {
    return this.cache;
  }

  updateSettings(partial: Partial<AppSettings>): AppSettings {
    const next = mergeSettings(this.cache, partial);
    this.cache = validateSettings(next);
    this.persist(this.cache);
    return this.cache;
  }
}
