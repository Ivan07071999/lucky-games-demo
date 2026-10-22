import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { resources } from './resources';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru',
    supportedLngs: ['ru', 'en'],
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'lucky-games-language',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

export { i18n };
