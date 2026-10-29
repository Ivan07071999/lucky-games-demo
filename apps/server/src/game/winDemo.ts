import {
  DEFAULT_PAYLINE_COUNT,
  type PaylineCount,
  type ReelGrid,
  type SymbolKey,
  type WinDemoSelection,
} from '@lucky-games/contracts';
import { SLOT_MATH } from './mathConfig.js';
import { generateReels } from './rules.js';

type RandomInt = (maxExclusive: number) => number;

/** Guarantees an exact-length win on a randomly selected payline; other lines remain random. */
export function generateWinningDemoReels(
  random: RandomInt,
  { symbol, count }: WinDemoSelection,
  paylineCount: PaylineCount = DEFAULT_PAYLINE_COUNT,
): ReelGrid {
  const reels = generateReels(random);
  const payline = SLOT_MATH.paylines[random(paylineCount)];
  const blocker: SymbolKey = symbol === 'defaultA' ? 'defaultJ' : 'defaultA';
  const touchedReels = count < reels.length ? count + 1 : count;

  // A Wild elsewhere on one of these reels would expand and replace the selected line.
  for (let reel = 0; reel < touchedReels; reel += 1) {
    for (let row = 0; row < reels[reel].length; row += 1) {
      if (reels[reel][row] === 'wild') reels[reel][row] = blocker;
    }
  }
  for (let reel = 0; reel < count; reel += 1) reels[reel][payline[reel]] = symbol;
  if (count === 3 || count === 4) reels[count][payline[count]] = blocker;
  return reels;
}
