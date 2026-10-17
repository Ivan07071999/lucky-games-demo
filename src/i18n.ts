import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

const resources = {
  ru: {
    translation: {
      nav: {
        games: 'Игры',
        about: 'О проекте',
        switchToEnglish: 'Переключить язык на английский',
        switchToRussian: 'Переключить язык на русский',
      },
      theme: {
        switchToLight: 'Включить светлую тему',
        switchToDark: 'Включить тёмную тему',
      },
      hero: {
        collection: 'КОЛЛЕКЦИЯ ИГР',
        headlineFirst: 'Найди игру',
        headlineSecond: 'под своё настроение.',
        description: 'Две истории, два мира и один выбор — с чего начнётся твоё приключение?',
        browseGames: 'Смотреть игры',
      },
      catalog: {
        eyebrow: 'ВЫБЕРИ СВОЙ МИР',
        title: 'Каталог игр',
        selectHint: 'Выбери карточку, чтобы отметить игру',
        selected: 'Выбрана игра «{{title}}»',
        searchLabel: 'Поиск игр',
        searchPlaceholder: 'Найти игру...',
        gameNumber: 'ИГРА {{number}}',
        selectedBadge: 'ВЫБРАНА',
        notFoundTitle: 'Ничего не найдено',
        notFoundDescription: 'Попробуй изменить поисковый запрос.',
      },
      games: {
        moonGarden: {
          artwork: 'MOON GARDEN',
          title: 'Лунный сад',
          description: 'Космическая история о редких созвездиях и тихой магии.',
          category: 'Космос · Фэнтези',
        },
        goldenTemple: {
          artwork: 'GOLDEN TEMPLE',
          title: 'Золотой храм',
          description: 'Путешествие по древним залам в поисках артефактов.',
          category: 'Приключение · Классика',
        },
      },
      footer: { tagline: 'Играй в своём ритме' },
    },
  },
  en: {
    translation: {
      nav: {
        games: 'Games',
        about: 'About',
        switchToEnglish: 'Switch language to English',
        switchToRussian: 'Switch language to Russian',
      },
      theme: {
        switchToLight: 'Switch to light theme',
        switchToDark: 'Switch to dark theme',
      },
      hero: {
        collection: 'GAME COLLECTION',
        headlineFirst: 'Find a game',
        headlineSecond: 'that fits your mood.',
        description: 'Two stories, two worlds, one choice — where will your adventure begin?',
        browseGames: 'Explore games',
      },
      catalog: {
        eyebrow: 'CHOOSE YOUR WORLD',
        title: 'Game library',
        selectHint: 'Select a card to choose a game',
        selected: 'Selected: “{{title}}”',
        searchLabel: 'Search games',
        searchPlaceholder: 'Find a game...',
        gameNumber: 'GAME {{number}}',
        selectedBadge: 'SELECTED',
        notFoundTitle: 'No games found',
        notFoundDescription: 'Try changing your search.',
      },
      games: {
        moonGarden: {
          artwork: 'MOON GARDEN',
          title: 'Moon Garden',
          description: 'A cosmic tale of rare constellations and quiet magic.',
          category: 'Space · Fantasy',
        },
        goldenTemple: {
          artwork: 'GOLDEN TEMPLE',
          title: 'Golden Temple',
          description: 'Journey through ancient halls in search of lost treasures.',
          category: 'Adventure · Classic',
        },
      },
      footer: { tagline: 'Play at your own pace' },
    },
  },
} as const

i18n
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
  })

export default i18n
