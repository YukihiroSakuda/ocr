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
  textNormalization: TextNormalizationSetting;
}

export const MAX_HISTORY_ITEMS = 200;

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'jpn+eng',
  autoCopy: true,
  autoProcessClipboard: true,
  theme: 'system',
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

  return {
    language: settings.language || DEFAULT_SETTINGS.language,
    autoCopy: Boolean(settings.autoCopy),
    autoProcessClipboard: Boolean(settings.autoProcessClipboard),
    theme: safeTheme,
    textNormalization: {
      trimWhitespace: Boolean(settings.textNormalization.trimWhitespace),
      collapseWhitespace: Boolean(settings.textNormalization.collapseWhitespace),
      removeLineBreaks: Boolean(settings.textNormalization.removeLineBreaks)
    }
  };
};
