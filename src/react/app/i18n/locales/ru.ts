const ru = {
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
    game: {
      canvasLabel: 'Игровое поле «Золотой храм»',
      loading: 'Загрузка игры…',
    },
    footer: { tagline: 'Играй в своём ритме' },
  },
} as const

export default ru
