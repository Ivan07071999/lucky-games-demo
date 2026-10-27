import { z } from 'zod';

export const SYMBOLS = [
  'defaultA',
  'defaultJ',
  'defaultK',
  'defaultQ',
  'highAnkh',
  'highEye',
  'highNecklace',
  'highScarab',
  'wild',
] as const;

export type SymbolKey = (typeof SYMBOLS)[number];
export type SymbolPayouts = Record<SymbolKey, [number, number, number]>;
export type Reel = [SymbolKey, SymbolKey, SymbolKey];
export type ReelGrid = [Reel, Reel, Reel, Reel, Reel];
export type Position = [reelIndex: number, rowIndex: number];
export type GameAction = 'SPIN' | 'FREE_SPIN';
export type NextAction = GameAction;

export const SLOT_ERROR_CODES = [
  'UNAUTHORIZED',
  'SESSION_NOT_FOUND',
  'ROUND_NOT_FOUND',
  'REQUEST_ID_CONFLICT',
  'INVALID_REQUEST',
  'INVALID_BET',
  'INSUFFICIENT_BALANCE',
  'FREE_SPINS_PENDING',
  'NO_FREE_SPINS',
  'SPIN_IN_PROGRESS',
  'BALANCE_OVERFLOW',
  'INTERNAL_ERROR',
] as const;
export type SlotErrorCode = (typeof SLOT_ERROR_CODES)[number];

export const SLOT_ANIMATIONS = [
  'REELS_STOP',
  'WILD_EXPAND',
  'MULTIPLIER_SHOW',
  'WIN_LINES',
  'WIN_COUNTER',
  'FREE_SPINS_START',
] as const;
export type SlotAnimation = (typeof SLOT_ANIMATIONS)[number];

export type WinType = 'NO_WIN' | 'NORMAL_WIN' | 'BIG_WIN' | 'MEGA_WIN' | 'SUPER_MEGA_WIN';

export interface WinClassification {
  winType: WinType;
  winMultiplier: number;
}

export interface Bet {
  bet: number;
  level: number;
  coinValueCents: number;
  totalCoins: number;
}

export interface Win {
  lineId: number;
  symbol: SymbolKey;
  count: number;
  positions: Position[];
  basePayoutCoins: number;
  multiplier: number;
  payoutCoins: number;
}

export interface RoundResult {
  requestId: string;
  roundId: string;
  status: 'completed';
  mode: 'BASE_GAME' | 'FREE_SPINS';
  isWin: boolean;
  netCoins: number;
  bet: Bet;
  balance: { before: number; afterBet: number; afterWin: number };
  reels: ReelGrid;
  wins: Win[];
  totalWinCoins: number;
  // Старые сохранённые раунды могут не содержать классификацию.
  winType?: WinType;
  winMultiplier?: number;
  features: {
    wild: {
      triggered: boolean;
      type: 'EXPANDING';
      expandedReels: number[];
      stickyReels: number[];
      multipliers: Record<string, number>;
    };
    freeSpins: {
      triggered: boolean;
      awarded: number;
      remaining: number;
      totalWinCoins: number;
      completion?: WinClassification & {
        baseBetCoins: number;
        totalWinCoins: number;
      };
    };
  };
  animations: SlotAnimation[];
  nextAction: NextAction;
}

export interface SlotState {
  sessionId: string;
  balanceCoins: number;
  freeSpins: { remaining: number; totalWinCoins: number; stickyReels: number[] };
  lastBet: Bet | null;
  nextAction: NextAction;
  config: {
    bets: number[];
    levels: number[];
    coinValuesCents: number[];
    paylines: number[][];
    payouts: SymbolPayouts;
    wildMultiplier: number;
    scatterSymbol: SymbolKey;
    scatterTriggerCount: number;
    freeSpinsAwarded: number;
  };
}

export type SlotCommand =
  | {
      type: 'SPIN';
      sessionId: string;
      requestId: string;
      bet: number;
      level: number;
      coinValueCents: number;
    }
  | { type: 'FREE_SPIN'; sessionId: string; requestId: string };

export type SlotMessage =
  | { type: 'ROUND_RESULT'; requestId: string; result: RoundResult }
  | { type: 'ERROR'; requestId: string | null; code: SlotErrorCode; message: string };

const nonNegativeInteger = z.number().int().nonnegative();
const positiveInteger = nonNegativeInteger.positive();
const reelIndex = nonNegativeInteger.max(4);
const rowIndex = nonNegativeInteger.max(2);
const symbol = z.enum(SYMBOLS);
const payoutCoefficients = z.tuple([nonNegativeInteger, nonNegativeInteger, nonNegativeInteger]);
const winType = z.enum(['NO_WIN', 'NORMAL_WIN', 'BIG_WIN', 'MEGA_WIN', 'SUPER_MEGA_WIN']);
const action = z.enum(['SPIN', 'FREE_SPIN']);

const betSchema: z.ZodType<Bet> = z.object({
  bet: positiveInteger,
  level: positiveInteger,
  coinValueCents: positiveInteger,
  totalCoins: positiveInteger,
});

const winSchema: z.ZodType<Win> = z
  .object({
    lineId: positiveInteger,
    symbol,
    count: positiveInteger.max(5),
    positions: z
      .array(z.tuple([reelIndex, rowIndex]))
      .min(1)
      .max(5),
    basePayoutCoins: nonNegativeInteger,
    multiplier: positiveInteger,
    payoutCoins: nonNegativeInteger,
  })
  .refine((win) => win.positions.length === win.count, { path: ['positions'] });

const reelSchema = z.tuple([symbol, symbol, symbol]);
const reelGridSchema: z.ZodType<ReelGrid> = z.tuple([
  reelSchema,
  reelSchema,
  reelSchema,
  reelSchema,
  reelSchema,
]);

const winClassificationSchema = z.object({
  winType,
  winMultiplier: z.number().finite().nonnegative(),
});

export const slotStateSchema: z.ZodType<SlotState> = z.object({
  sessionId: z.string().min(1),
  balanceCoins: nonNegativeInteger,
  freeSpins: z.object({
    remaining: nonNegativeInteger,
    totalWinCoins: nonNegativeInteger,
    stickyReels: z.array(reelIndex),
  }),
  lastBet: betSchema.nullable(),
  nextAction: action,
  config: z.object({
    bets: z.array(positiveInteger).nonempty(),
    levels: z.array(positiveInteger).nonempty(),
    coinValuesCents: z.array(positiveInteger).nonempty(),
    paylines: z.array(z.tuple([rowIndex, rowIndex, rowIndex, rowIndex, rowIndex])),
    payouts: z.object({
      defaultA: payoutCoefficients,
      defaultJ: payoutCoefficients,
      defaultK: payoutCoefficients,
      defaultQ: payoutCoefficients,
      highAnkh: payoutCoefficients,
      highEye: payoutCoefficients,
      highNecklace: payoutCoefficients,
      highScarab: payoutCoefficients,
      wild: payoutCoefficients,
    }),
    wildMultiplier: positiveInteger,
    scatterSymbol: symbol,
    scatterTriggerCount: positiveInteger,
    freeSpinsAwarded: positiveInteger,
  }),
});

export const roundResultSchema: z.ZodType<RoundResult> = z.object({
  requestId: z.string().min(1),
  roundId: z.string().min(1),
  status: z.literal('completed'),
  mode: z.enum(['BASE_GAME', 'FREE_SPINS']),
  isWin: z.boolean(),
  netCoins: z.number().int(),
  bet: betSchema,
  balance: z.object({
    before: nonNegativeInteger,
    afterBet: nonNegativeInteger,
    afterWin: nonNegativeInteger,
  }),
  reels: reelGridSchema,
  wins: z.array(winSchema),
  totalWinCoins: nonNegativeInteger,
  winType: winType.optional(),
  winMultiplier: z.number().finite().nonnegative().optional(),
  features: z.object({
    wild: z.object({
      triggered: z.boolean(),
      type: z.literal('EXPANDING'),
      expandedReels: z.array(reelIndex),
      stickyReels: z.array(reelIndex),
      multipliers: z.record(z.string(), positiveInteger),
    }),
    freeSpins: z.object({
      triggered: z.boolean(),
      awarded: nonNegativeInteger,
      remaining: nonNegativeInteger,
      totalWinCoins: nonNegativeInteger,
      completion: winClassificationSchema
        .extend({ baseBetCoins: positiveInteger, totalWinCoins: nonNegativeInteger })
        .optional(),
    }),
  }),
  animations: z.array(z.enum(SLOT_ANIMATIONS)),
  nextAction: action,
});

export const slotMessageSchema: z.ZodType<SlotMessage> = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ROUND_RESULT'),
    requestId: z.string().min(1),
    result: roundResultSchema,
  }),
  z.object({
    type: z.literal('ERROR'),
    requestId: z.string().min(1).nullable(),
    code: z.enum(SLOT_ERROR_CODES),
    message: z.string(),
  }),
]);
