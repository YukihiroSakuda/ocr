export interface LanguageOption {
  code: string;
  label: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'eng', label: 'English' },
  { code: 'jpn', label: 'Japanese' },
  { code: 'chi_sim', label: 'Chinese (Simplified)' },
  { code: 'chi_tra', label: 'Chinese (Traditional)' },
  { code: 'kor', label: 'Korean' },
  { code: 'fra', label: 'French' },
  { code: 'deu', label: 'German' },
  { code: 'spa', label: 'Spanish' },
  { code: 'ita', label: 'Italian' },
  { code: 'por', label: 'Portuguese' },
  { code: 'rus', label: 'Russian' }
];

const optionMap = new Map(LANGUAGE_OPTIONS.map((option) => [option.code, option.label]));

export const parseLanguageString = (value: string | null | undefined): string[] => {
  if (!value) return [];
  return value
    .split('+')
    .map((segment) => segment.trim())
    .filter((segment, index, array) => segment.length > 0 && array.indexOf(segment) === index);
};

export const formatLanguageSelection = (codes: string[]): string => {
  const sanitized = codes
    .map((code) => code.trim())
    .filter((code, index, array) => code.length > 0 && array.indexOf(code) === index);
  return sanitized.join('+');
};

export const getLanguageLabels = (codes: string[]): string[] => {
  if (!codes.length) return [];
  return codes.map((code) => optionMap.get(code) ?? code);
};
