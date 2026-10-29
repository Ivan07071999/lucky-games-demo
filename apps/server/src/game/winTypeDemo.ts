import type { PaylineCount, ReelGrid, SymbolKey, WinDemoType } from '@lucky-games/contracts';

type RandomInt = (maxExclusive: number) => number;
const PREMIUM_SYMBOLS = ['highAnkh', 'highEye', 'highNecklace'] as const;

// Different symbols on the first three reels prevent new wins after a demo cascade refills.
const BACKGROUND: readonly SymbolKey[] = [
  'defaultA',
  'defaultJ',
  'defaultK',
  'defaultQ',
  'defaultA',
];

export function createWinTypeDemoRefillSymbol(random: RandomInt): (reelIndex: number) => SymbolKey {
  const offset = random(PREMIUM_SYMBOLS.length);
  const refillSymbols: readonly (readonly SymbolKey[])[] = [
    ['defaultA', 'defaultQ', PREMIUM_SYMBOLS[offset]],
    ['defaultJ', PREMIUM_SYMBOLS[(offset + 1) % PREMIUM_SYMBOLS.length]],
    ['defaultK', PREMIUM_SYMBOLS[(offset + 2) % PREMIUM_SYMBOLS.length]],
    ['defaultQ', 'defaultA', 'highAnkh'],
    ['defaultA', 'defaultJ', 'highEye'],
  ];
  const previousSymbols = [...BACKGROUND];
  return (reelIndex) => {
    // The first three reels have disjoint pools, so refill cannot form another paid line.
    const choices = refillSymbols[reelIndex].filter(
      (symbol) => symbol !== previousSymbols[reelIndex],
    );
    const symbol = choices[random(choices.length)];
    previousSymbols[reelIndex] = symbol;
    return symbol;
  };
}

export function generateWinTypeDemoReels(
  random: RandomInt,
  winType: WinDemoType,
  paylineCount: PaylineCount,
): ReelGrid {
  const reels = BACKGROUND.map((symbol) => [symbol, symbol, symbol]) as ReelGrid;
  const fillRows = (
    rows: readonly number[],
    reelCount: number,
    symbol: SymbolKey = 'highAnkh',
  ): void => {
    for (let reel = 0; reel < reelCount; reel += 1) {
      for (const row of rows) reels[reel][row] = symbol;
    }
  };

  switch (winType) {
    case 'NORMAL_WIN': {
      const row = random(3);
      const reelCount = 3 + random(2);
      const symbol = PREMIUM_SYMBOLS[random(PREMIUM_SYMBOLS.length)];
      fillRows([row], reelCount, symbol);
      break;
    }
    case 'BIG_WIN': {
      const rowPairs = [
        [0, 1],
        [0, 2],
        [1, 2],
      ] as const;
      const [firstRow, secondRow] = rowPairs[random(rowPairs.length)];
      const firstSymbol = PREMIUM_SYMBOLS[random(PREMIUM_SYMBOLS.length)];
      const secondSymbol = PREMIUM_SYMBOLS[random(PREMIUM_SYMBOLS.length)];
      fillRows([firstRow], 5, firstSymbol);
      fillRows([secondRow], 4 + random(2), secondSymbol);
      break;
    }
    case 'MEGA_WIN': {
      if (random(2) === 0) {
        // Nine full Ankh lines would reach SUPER_MEGA_WIN, so use lower-paying symbols there.
        const symbols = paylineCount === 9 ? PREMIUM_SYMBOLS.slice(1) : PREMIUM_SYMBOLS;
        fillRows([0, 1, 2], 5, symbols[random(symbols.length)]);
      } else {
        // Two separated full lines with an expanded Wild pay x72 at minimum.
        fillRows([0, 2], 5);
        const wildReels = [0, 2, 3, 4] as const;
        reels[wildReels[random(wildReels.length)]][0] = 'wild';
      }
      break;
    }
    case 'SUPER_MEGA_WIN': {
      const variant = random(4);
      if (variant === 3) {
        // Three mixed full lines with an expanded Wild pay at least x102.
        const ankhRow = random(3);
        for (let reel = 0; reel < 5; reel += 1) {
          for (let row = 0; row < 3; row += 1) {
            reels[reel][row] = row === ankhRow ? 'highAnkh' : 'highEye';
          }
        }
        reels[random(5)][0] = 'wild';
        break;
      }

      const symbolPool = variant === 2 ? PREMIUM_SYMBOLS.slice(0, 2) : PREMIUM_SYMBOLS;
      const symbol = symbolPool[random(symbolPool.length)];
      fillRows([0, 1, 2], 5, symbol);

      if (variant === 2) {
        // Five four-of-a-kind lines with an expanded Wild still pay at least x105.
        const otherSymbols = PREMIUM_SYMBOLS.filter((candidate) => candidate !== symbol);
        const otherSymbol = otherSymbols[random(otherSymbols.length)];
        reels[4] = [otherSymbol, otherSymbol, otherSymbol];
        reels[random(4)][0] = 'wild';
      } else {
        // Five full lines with one or two Wild reels pay at least x150.
        const firstWildReel = random(5);
        reels[firstWildReel][0] = 'wild';
        if (variant === 1) {
          const secondWildReel = (firstWildReel + 1 + random(4)) % 5;
          reels[secondWildReel][0] = 'wild';
        }
      }
      break;
    }
  }

  return reels;
}
