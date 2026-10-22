import { useEffect } from 'react';

export type Language = 'ru' | 'en';

export function useDocumentLanguage(language: Language) {
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
}
