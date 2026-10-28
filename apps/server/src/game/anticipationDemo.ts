import { SYMBOLS, type ReelGrid, type SymbolKey } from '@lucky-games/contracts';
import { SLOT_MATH } from './mathConfig.js';
import { generateReels } from './rules.js';

type RandomInt = (maxExclusive: number) => number;

/** Changes the symbol distribution only for explicitly requested demo rounds. */
export function generateAnticipationDemoReels(randomInt: RandomInt): ReelGrid {
  const reels = generateReels(randomInt, 'BASE_GAME');
  const targetReel = 2 + randomInt(3);
  const safeSymbols = SYMBOLS.filter(
    (symbol) => symbol !== SLOT_MATH.scatterSymbol && symbol !== 'wild',
  );
  const totalWeight = safeSymbols.reduce(
    (total, symbol) => total + SLOT_MATH.symbolWeights.BASE_GAME[symbol],
    0,
  );
  const drawSafeSymbol = (): SymbolKey => {
    const stop = randomInt(totalWeight);
    let weight = 0;
    for (const symbol of safeSymbols) {
      weight += SLOT_MATH.symbolWeights.BASE_GAME[symbol];
      if (stop < weight) return symbol;
    }
    throw new Error('Random source returned a value outside the symbol weights');
  };

  // Remove accidental Scatters and expanding Wilds before the selected reel.
  // The unrevealed reels stay random, so anticipation does not promise Free Spins.
  for (let reelIndex = 0; reelIndex < targetReel; reelIndex += 1) {
    for (let row = 0; row < 3; row += 1) {
      if (reels[reelIndex][row] === SLOT_MATH.scatterSymbol || reels[reelIndex][row] === 'wild') {
        reels[reelIndex][row] = drawSafeSymbol();
      }
    }
  }

  // The second Scatter is on the reel immediately preceding the delayed reel.
  // This prevents an earlier reel from claiming the anticipation hint.
  reels[randomInt(targetReel - 1)][randomInt(3)] = SLOT_MATH.scatterSymbol;
  reels[targetReel - 1][randomInt(3)] = SLOT_MATH.scatterSymbol;
  return reels;
}
