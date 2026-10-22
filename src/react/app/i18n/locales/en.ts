const en = {
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
    game: {
      canvasLabel: 'Golden Temple game canvas',
      loading: 'Loading the game…',
      loadError: 'Could not load the game. Please try again.',
      incompatibleServer: 'The game server uses an outdated API version. Restart the server.',
      retry: 'Retry',
    },
    footer: { tagline: 'Play at your own pace' },
  },
} as const;

export default en;
