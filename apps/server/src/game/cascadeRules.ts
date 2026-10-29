import {
  DEFAULT_PAYLINE_COUNT,
  type Bet,
  type CascadeSequence,
  type PaylineCount,
  type Position,
  type ReelGrid,
  type SymbolKey,
} from '@lucky-games/contracts';
import { drawSymbol, evaluateRound, generateReels } from './rules.js';
import { SLOT_MATH } from './mathConfig.js';

const MAX_CASCADES = 20;
type RandomInt = (maxExclusive: number) => number;
type Evaluated = ReturnType<typeof evaluateRound>;

function refill(
  reels: ReelGrid,
  removedPositions: Position[],
  random: RandomInt,
  demoRefillSymbol?: (reelIndex: number) => SymbolKey,
): ReelGrid {
  return reels.map((column, reelIndex) => {
    const removedRows = new Set(
      removedPositions.filter(([index]) => index === reelIndex).map(([, row]) => row),
    );
    const survivors = column.filter((_, row) => !removedRows.has(row));
    const incoming = Array.from(
      { length: removedRows.size },
      () => demoRefillSymbol?.(reelIndex) ?? drawSymbol(random),
    );
    return [...incoming, ...survivors];
  }) as ReelGrid;
}

export function calculateCascadeRound(
  random: RandomInt,
  bet: Bet,
  startingReels: ReelGrid = generateReels(random),
  paylineCount: PaylineCount = DEFAULT_PAYLINE_COUNT,
  demoRefillSymbol?: (reelIndex: number) => SymbolKey,
): Evaluated & { cascade: CascadeSequence } {
  let current = evaluateRound(startingReels, bet, 'BASE_GAME', [], SLOT_MATH, paylineCount);
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
      refill(current.reels, removedPositions, random, demoRefillSymbol),
      bet,
      'BASE_GAME',
      [],
      SLOT_MATH,
      paylineCount,
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
