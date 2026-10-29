import { SYMBOLS, type SymbolKey } from '@lucky-games/contracts';

type Payline = readonly [number, number, number, number, number];
type Payouts = Record<SymbolKey, readonly [number, number, number]>;
type SymbolWeights = Record<SymbolKey, number>;

export interface SlotMathConfig {
  readonly paylines: readonly Payline[];
  readonly bets: readonly number[];
  readonly levels: readonly number[];
  readonly coinValuesCents: readonly number[];
  readonly initialBalance: number;
  readonly freeSpinsAwarded: number;
  readonly scatterSymbol: SymbolKey;
  readonly scatterTriggerCount: number;
  readonly wildMultiplier: number;
  readonly winThresholds: {
    readonly big: number;
    readonly mega: number;
    readonly superMega: number;
  };
  readonly payouts: Payouts;
  readonly symbolWeights: {
    readonly BASE_GAME: SymbolWeights;
    readonly FREE_SPINS: SymbolWeights;
  };
}

export const SLOT_MATH = {
  // The first five lines keep their IDs; seven and nine line modes extend this prefix.
  paylines: [
    [0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
    [2, 2, 2, 2, 2],
    [0, 1, 2, 1, 0],
    [2, 1, 0, 1, 2],
    [0, 1, 0, 1, 0],
    [2, 1, 2, 1, 2],
    [1, 0, 1, 0, 1],
    [1, 2, 1, 2, 1],
  ],
  bets: Array.from({ length: 20 }, (_, index) => index + 1),
  levels: Array.from({ length: 10 }, (_, index) => index + 1),
  coinValuesCents: [1, 2, 5, 10, 20, 50, 100],
  initialBalance: 250_000,
  freeSpinsAwarded: 8,
  scatterSymbol: 'highScarab',
  scatterTriggerCount: 3,
  wildMultiplier: 3,
  winThresholds: { big: 15, mega: 50, superMega: 100 },
  payouts: {
    defaultA: [1, 3, 5],
    defaultJ: [1, 3, 5],
    defaultK: [1, 3, 5],
    defaultQ: [1, 3, 5],
    highAnkh: [4, 8, 12],
    highEye: [3, 7, 11],
    highNecklace: [3, 6, 10],
    highScarab: [0, 0, 0],
    wild: [0, 0, 0],
  },
  // Веса задают относительную частоту символа в одной видимой позиции.
  symbolWeights: {
    BASE_GAME: {
      defaultA: 19,
      defaultJ: 19,
      defaultK: 19,
      defaultQ: 19,
      highAnkh: 4,
      highEye: 4,
      highNecklace: 4,
      highScarab: 2,
      wild: 1,
    },
    FREE_SPINS: {
      defaultA: 18,
      defaultJ: 18,
      defaultK: 18,
      defaultQ: 18,
      highAnkh: 4,
      highEye: 4,
      highNecklace: 4,
      highScarab: 2,
      wild: 1,
    },
  },
} as const satisfies SlotMathConfig;

export function assertSlotMathConfig(config: SlotMathConfig): void {
  const positive = (value: number): boolean => Number.isSafeInteger(value) && value > 0;
  const nonNegative = (value: number): boolean => Number.isSafeInteger(value) && value >= 0;

  if (!nonNegative(config.initialBalance)) throw new Error('Invalid initial balance');
  if (!positive(config.freeSpinsAwarded)) throw new Error('Invalid free spin count');
  if (!positive(config.scatterTriggerCount) || config.scatterTriggerCount > 15) {
    throw new Error('Invalid scatter trigger count');
  }
  if (!positive(config.wildMultiplier)) throw new Error('Invalid Wild multiplier');
  if (
    !positive(config.winThresholds.big) ||
    config.winThresholds.big >= config.winThresholds.mega ||
    config.winThresholds.mega >= config.winThresholds.superMega
  ) {
    throw new Error('Invalid win classification thresholds');
  }
  for (const [name, values] of [
    ['bets', config.bets],
    ['levels', config.levels],
    ['coin values', config.coinValuesCents],
  ] as const) {
    if (values.length === 0 || values.some((value) => !positive(value))) {
      throw new Error(`Invalid ${name}`);
    }
  }
  if (config.paylines.length === 0) throw new Error('At least one payline is required');
  for (const line of config.paylines) {
    if (line.length !== 5 || line.some((row) => !nonNegative(row) || row > 2)) {
      throw new Error('Invalid payline');
    }
  }
  for (const symbol of SYMBOLS) {
    const payouts = config.payouts[symbol];
    if (payouts.length !== 3 || payouts.some((value) => !nonNegative(value))) {
      throw new Error(`Invalid payouts for ${symbol}`);
    }
  }
  for (const mode of ['BASE_GAME', 'FREE_SPINS'] as const) {
    const totalWeight = SYMBOLS.reduce((total, symbol) => {
      const weight = config.symbolWeights[mode][symbol];
      if (!nonNegative(weight)) throw new Error(`Invalid ${mode} weight for ${symbol}`);
      return total + weight;
    }, 0);
    if (!positive(totalWeight)) throw new Error(`Invalid ${mode} symbol weight total`);
  }
}

assertSlotMathConfig(SLOT_MATH);
