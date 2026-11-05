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
    notFound: {
      eyebrow: 'PAGE NOT FOUND',
      title: 'Looks like you took a wrong turn',
      description: 'The page you are looking for does not exist or may have been moved.',
      backToCatalog: 'Back to the catalog',
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
        artwork: 'CROWNS OF KEMET',
        title: 'Crowns of Kemet',
        description: 'Journey through ancient halls in search of lost treasures.',
        category: 'Adventure · Classic',
      },
    },
    game: {
      canvasLabel: 'Crowns of Kemet game canvas',
      loading: 'Loading the game…',
      loadError: 'Could not load the game. Please try again.',
      recoveringRound: 'Restoring the previous round…',
      recoverRoundError: 'Could not restore the round. Retry when the connection returns.',
      incompatibleServer: 'The game server uses an outdated API version. Restart the server.',
      retry: 'Retry',
      insufficientBalance: 'Not enough coins for MAX BET.',
    },
    footer: { tagline: 'Play at your own pace' },
  },
} as const;

export default en;
