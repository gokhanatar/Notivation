import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, SupportedLanguage } from './translations';
import { languages, LanguageCode } from './languages';

const supportedCodes = languages.map(l => l.code) as readonly string[];

function detectLanguage(): LanguageCode {
  try {
    const browserLang = navigator.language || '';
    // Try exact match first (e.g. "tr", "en")
    const code = browserLang.split('-')[0].toLowerCase();
    if (supportedCodes.includes(code)) return code as LanguageCode;
  } catch { /* ignore */ }
  return 'en';
}

interface I18nState {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      language: detectLanguage(),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'app-language',
    }
  )
);

export function useTranslation() {
  const language = useI18nStore((s) => s.language);
  
  const t = (key: string, params?: Record<string, string | number>): string => {
    // Try to get translation in current language
    const langTranslations = translations[language as SupportedLanguage] as Record<string, string> | undefined;
    const enTranslations = translations.en as Record<string, string>;
    let text = langTranslations?.[key] || enTranslations[key] || key;
    
    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    
    return text;
  };
  
  return { t, language };
}

export { languages, type LanguageCode };
export { translations, type SupportedLanguage };
export { useI18nStore as useLanguageStore };
