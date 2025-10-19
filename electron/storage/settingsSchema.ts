export type ThemePreference = 'system' | 'light' | 'dark';

export interface TextNormalizationSetting {
  trimWhitespace: boolean;
  collapseWhitespace: boolean;
  removeLineBreaks: boolean;
}

export interface AppSettings {
  language: string;
  autoCopy: boolean;
  autoProcessClipboard: boolean;
  theme: ThemePreference;
  maxHistoryItems: number;
  textNormalization: TextNormalizationSetting;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'jpn+eng',
  autoCopy: true,
  autoProcessClipboard: true,
  theme: 'system',
  maxHistoryItems: 200,
  textNormalization: {
    trimWhitespace: true,
    collapseWhitespace: false,
    removeLineBreaks: false
  }
};

export const mergeSettings = (current: AppSettings, partial: Partial<AppSettings>): AppSettings => ({
  ...current,
  ...partial,
  textNormalization: {
    ...current.textNormalization,
    ...(partial.textNormalization ?? {})
  }
});

export const validateSettings = (settings: AppSettings): AppSettings => {
  const safeTheme: ThemePreference = ['system', 'light', 'dark'].includes(settings.theme)
    ? settings.theme
    : 'system';

  const maxHistoryItems = Number.isFinite(settings.maxHistoryItems)
    ? Math.max(1, Math.min(500, Math.trunc(settings.maxHistoryItems)))
    : DEFAULT_SETTINGS.maxHistoryItems;

  return {
    language: settings.language || DEFAULT_SETTINGS.language,
    autoCopy: Boolean(settings.autoCopy),
    autoProcessClipboard: Boolean(settings.autoProcessClipboard),
    theme: safeTheme,
    maxHistoryItems,
    textNormalization: {
      trimWhitespace: Boolean(settings.textNormalization.trimWhitespace),
      collapseWhitespace: Boolean(settings.textNormalization.collapseWhitespace),
      removeLineBreaks: Boolean(settings.textNormalization.removeLineBreaks)
    }
  };
};
