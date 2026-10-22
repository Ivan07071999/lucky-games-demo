import type { Bet, ReelGrid, RoundResult, SymbolKey, Win } from '@lucky-games/contracts';
import { SYMBOLS } from '@lucky-games/contracts';

export const PAYLINES = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
] as const;
export const BETS = Array.from({ length: 20 }, (_, i) => i + 1);
export const LEVELS = Array.from({ length: 10 }, (_, i) => i + 1);
export const COIN_VALUES = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1];
export const INITIAL_BALANCE = 250_000;
export const FREE_SPINS_AWARDED = 8;

type RandomInt = (maxExclusive: number) => number;
type PayoutTable = Record<SymbolKey, readonly [number, number, number]>;
const PAYOUTS: PayoutTable = {
  defaultA: [1, 3, 5],
  defaultJ: [1, 3, 5],
  defaultK: [1, 3, 5],
  defaultQ: [1, 3, 5],
  highAnkh: [4, 8, 12],
  highEye: [3, 7, 11],
  highNecklace: [3, 6, 10],
  highScarab: [0, 0, 0],
  wild: [0, 0, 0],
};
const STOP_SYMBOLS = SYMBOLS.filter((symbol) => symbol !== 'wild');

export function validateBet(bet: number, level: number, coinValue: number): Bet | null {
  if (!BETS.includes(bet) || !LEVELS.includes(level) || !COIN_VALUES.includes(coinValue))
    return null;
  return { bet, level, coinValue, totalCoins: bet * level };
}

export function generateReels(randomInt: RandomInt): ReelGrid {
  const reels = Array.from({ length: 5 }, () =>
    Array.from({ length: 3 }, () => {
      // Wild встречается реже других символов; Scarab запускает бонус.
      const stop = randomInt(STOP_SYMBOLS.length * 10 + 2);
      return stop < 2 ? 'wild' : STOP_SYMBOLS[Math.floor((stop - 2) / 10)];
    }),
  );
  return reels as ReelGrid;
}

export function evaluateRound(
  reels: ReelGrid,
  bet: Bet,
  mode: RoundResult['mode'],
  stickyReels: number[],
): Pick<RoundResult, 'reels' | 'wins' | 'totalWinCoins' | 'features' | 'animations'> {
  const expandedReels: number[] = [];
  const activeSticky = mode === 'FREE_SPINS' ? [...stickyReels] : [];
  for (let reel = 0; reel < reels.length; reel += 1) {
    if (activeSticky.includes(reel) || reels[reel].includes('wild')) {
      reels[reel] = ['wild', 'wild', 'wild'];
      expandedReels.push(reel);
      if (mode === 'FREE_SPINS' && !activeSticky.includes(reel)) activeSticky.push(reel);
    }
  }

  const wins: Win[] = [];
  for (const [lineIndex, rows] of PAYLINES.entries()) {
    const line = rows.map((row, reel) => reels[reel][row]);
    const symbol = line.find((entry) => entry !== 'wild');
    if (!symbol || symbol === 'highScarab') continue;
    let count = 0;
    for (const entry of line) {
      if (entry !== symbol && entry !== 'wild') break;
      count += 1;
    }
    if (count < 3) continue;
    const basePayoutCoins = PAYOUTS[symbol][count - 3] * bet.totalCoins;
    if (!basePayoutCoins) continue;
    const multiplier = expandedReels.some((reel) => reel < count) ? 3 : 1;
    wins.push({
      lineId: lineIndex + 1,
      symbol,
      count,
      positions: rows.slice(0, count).map((row, reel) => [reel, row]),
      basePayoutCoins,
      multiplier,
      payoutCoins: basePayoutCoins * multiplier,
    });
  }

  const scatterCount = reels.flat().filter((symbol) => symbol === 'highScarab').length;
  const triggered = mode === 'BASE_GAME' && scatterCount >= 3;
  const multipliers = Object.fromEntries(expandedReels.map((reel) => [reel, 3]));
  const animations = ['REELS_STOP'];
  if (expandedReels.length) animations.push('WILD_EXPAND', 'MULTIPLIER_SHOW');
  if (wins.length) animations.push('WIN_LINES', 'WIN_COUNTER');
  if (triggered) animations.push('FREE_SPINS_START');

  return {
    reels,
    wins,
    totalWinCoins: wins.reduce((sum, win) => sum + win.payoutCoins, 0),
    features: {
      wild: {
        triggered: expandedReels.length > 0,
        type: 'EXPANDING',
        expandedReels,
        stickyReels: activeSticky.sort((a, b) => a - b),
        multipliers,
      },
      freeSpins: {
        triggered,
        awarded: triggered ? FREE_SPINS_AWARDED : 0,
        remaining: 0,
        totalWinCoins: 0,
      },
    },
    animations,
  };
}
