import type { Bet, CascadeSequence, Position, ReelGrid } from '@lucky-games/contracts';
import { drawSymbol, evaluateRound, generateReels } from './rules.js';

const MAX_CASCADES = 20;
type RandomInt = (maxExclusive: number) => number;
type Evaluated = ReturnType<typeof evaluateRound>;

function refill(reels: ReelGrid, removedPositions: Position[], random: RandomInt): ReelGrid {
  return reels.map((column, reelIndex) => {
    const removedRows = new Set(
      removedPositions.filter(([index]) => index === reelIndex).map(([, row]) => row),
    );
    const survivors = column.filter((_, row) => !removedRows.has(row));
    const incoming = Array.from({ length: removedRows.size }, () => drawSymbol(random));
    return [...incoming, ...survivors];
  }) as ReelGrid;
}

export function calculateCascadeRound(
  random: RandomInt,
  bet: Bet,
): Evaluated & { cascade: CascadeSequence } {
  let current = evaluateRound(generateReels(random), bet, 'BASE_GAME', []);
  const initialReels = current.reels;
  const steps: CascadeSequence['steps'] = [];
  let totalWinCoins = 0;

  while (current.wins.length > 0) {
    if (steps.length === MAX_CASCADES) throw new Error('Cascade limit exceeded');
    const removed = new Map<string, Position>();
    for (const win of current.wins) {
      for (const position of win.positions) removed.set(position.join(':'), position);
    }
    const removedPositions = [...removed.values()];
    const next = evaluateRound(
      refill(current.reels, removedPositions, random),
      bet,
      'BASE_GAME',
      [],
    );
    steps.push({
      reels: current.reels,
      wins: current.wins,
      removedPositions,
      after: next.reels,
      payoutCoins: current.totalWinCoins,
    });
    totalWinCoins += current.totalWinCoins;
    if (!Number.isSafeInteger(totalWinCoins)) throw new Error('Cascade win is too large');
    current = next;
  }
  return {
    ...current,
    wins: [],
    totalWinCoins,
    animations: totalWinCoins > 0 ? ['REELS_STOP', 'WIN_COUNTER'] : ['REELS_STOP'],
    cascade: { initialReels, steps },
  };
}
