import type { PaylineCount, ReelGrid, SymbolKey, WinDemoType } from '@lucky-games/contracts';

// Different symbols on the first three reels prevent new wins after a demo cascade refills.
const BACKGROUND: readonly SymbolKey[] = [
  'defaultA',
  'defaultJ',
  'defaultK',
  'defaultQ',
  'defaultA',
];

export function winTypeDemoRefillSymbol(reelIndex: number): SymbolKey {
  return BACKGROUND[reelIndex];
}

export function generateWinTypeDemoReels(
  winType: WinDemoType,
  paylineCount: PaylineCount,
): ReelGrid {
  const reels = BACKGROUND.map((symbol) => [symbol, symbol, symbol]) as ReelGrid;
  const fillRows = (rows: readonly number[], reelCount: number): void => {
    for (let reel = 0; reel < reelCount; reel += 1) {
      for (const row of rows) reels[reel][row] = 'highAnkh';
    }
  };

  switch (winType) {
    case 'NORMAL_WIN':
      fillRows([0], 3);
      break;
    case 'BIG_WIN':
      fillRows([0, 1], 5);
      break;
    case 'MEGA_WIN':
      if (paylineCount === 9) {
        fillRows([0, 1], 5);
        reels[2][2] = 'highAnkh';
      } else {
        fillRows([0, 1, 2], 5);
      }
      break;
    case 'SUPER_MEGA_WIN':
      fillRows([0, 1, 2], 5);
      reels[0][0] = 'wild';
      break;
  }

  return reels;
}
