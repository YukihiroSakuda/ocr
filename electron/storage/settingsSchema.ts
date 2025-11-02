export interface TextNormalizationSetting {
  trimWhitespace: boolean;
  collapseWhitespace: boolean;
  removeLineBreaks: boolean;
}

export interface AppSettings {
  language: string;
  autoCopy: boolean;
  autoProcessClipboard: boolean;
  textNormalization: TextNormalizationSetting;
}

export const MAX_HISTORY_ITEMS = 200;

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'jpn+eng',
  autoCopy: true,
  autoProcessClipboard: true,
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
  return {
    language: settings.language || DEFAULT_SETTINGS.language,
    autoCopy: Boolean(settings.autoCopy),
    autoProcessClipboard: Boolean(settings.autoProcessClipboard),
    textNormalization: {
      trimWhitespace: Boolean(settings.textNormalization.trimWhitespace),
      collapseWhitespace: Boolean(settings.textNormalization.collapseWhitespace),
      removeLineBreaks: Boolean(settings.textNormalization.removeLineBreaks)
    }
  };
};
