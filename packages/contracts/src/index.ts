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
export type SpinMode = 'CLASSIC' | 'CASCADE' | 'HYBRID';
export const PAYLINE_COUNTS = [5, 7, 9] as const;
export type PaylineCount = (typeof PAYLINE_COUNTS)[number];
export const DEFAULT_PAYLINE_COUNT: PaylineCount = 5;
export interface WinDemoSelection {
  symbol: SymbolKey;
  count: 3 | 4 | 5;
}

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
export const WIN_DEMO_TYPES = ['NORMAL_WIN', 'BIG_WIN', 'MEGA_WIN', 'SUPER_MEGA_WIN'] as const;
export type WinDemoType = (typeof WIN_DEMO_TYPES)[number];

export interface WinClassification {
  winType: WinType;
  winMultiplier: number;
}

export interface ReelAnticipationHint {
  /** Zero-based index of the reel that keeps spinning after the preceding reels stop. */
  reelIndex: number;
  /** Additional visual spin time; the server result is already final. */
  extraSpinMs: number;
}

export interface Bet {
  bet: number;
  level: number;
  coinValueCents: number;
  totalCoins: number;
  /** Active paylines for this round. Older stored bets omit this and use five. */
  paylineCount?: PaylineCount;
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

export interface CascadeStep {
  /** Evaluated grid before winning symbols are removed. */
  reels: ReelGrid;
  wins: Win[];
  removedPositions: Position[];
  /** Evaluated grid after gravity and refill. */
  after: ReelGrid;
  payoutCoins: number;
}

export interface CascadeSequence {
  initialReels: ReelGrid;
  steps: CascadeStep[];
}

export interface RoundResult {
  requestId: string;
  roundId: string;
  status: 'completed';
  mode: 'BASE_GAME' | 'FREE_SPINS';
  /** How the paid spin was presented. Older stored rounds may omit this field. */
  spinMode?: SpinMode;
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
  presentation?: { anticipation: ReelAnticipationHint | null };
  cascade?: CascadeSequence;
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
      /** Number of active paylines; defaults to five for older clients. */
      paylineCount?: PaylineCount;
      /** Demo only: server generates a round with two visible scatters before reel 3, 4 or 5. */
      anticipationDemo?: boolean;
      /** Demo only: guarantees this paying combination on a random payline. */
      winDemo?: WinDemoSelection;
      /** Demo only: server generates a paid round in this win category. */
      winTypeDemo?: WinDemoType;
      spinMode?: SpinMode;
      /** Legacy pending rounds; new clients send spinMode instead. */
      cascade?: boolean;
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
const spinMode = z.enum(['CLASSIC', 'CASCADE', 'HYBRID']);
const paylineCount = z.union([z.literal(5), z.literal(7), z.literal(9)]);

const betSchema: z.ZodType<Bet> = z.object({
  bet: positiveInteger,
  level: positiveInteger,
  coinValueCents: positiveInteger,
  totalCoins: positiveInteger,
  paylineCount: paylineCount.optional(),
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

const cascadeStepSchema: z.ZodType<CascadeStep> = z.object({
  reels: reelGridSchema,
  wins: z.array(winSchema).nonempty(),
  removedPositions: z.array(z.tuple([reelIndex, rowIndex])).nonempty(),
  after: reelGridSchema,
  payoutCoins: nonNegativeInteger,
});

const sameGrid = (left: ReelGrid, right: ReelGrid): boolean =>
  left.every((column, reel) => column.every((symbol, row) => symbol === right[reel][row]));

const cascadeSequenceSchema: z.ZodType<CascadeSequence> = z
  .object({
    initialReels: reelGridSchema,
    steps: z.array(cascadeStepSchema).max(20),
  })
  .superRefine((sequence, context) => {
    let previous = sequence.initialReels;
    sequence.steps.forEach((step, index) => {
      const paid = step.wins.reduce((sum, win) => sum + win.payoutCoins, 0);
      const winningPositions = new Set(
        step.wins.flatMap((win) => win.positions.map((position) => position.join(':'))),
      );
      const removedPositions = new Set(step.removedPositions.map((position) => position.join(':')));
      if (
        !sameGrid(step.reels, previous) ||
        paid !== step.payoutCoins ||
        step.removedPositions.length !== removedPositions.size ||
        removedPositions.size !== winningPositions.size ||
        [...removedPositions].some((position) => !winningPositions.has(position))
      ) {
        context.addIssue({
          code: 'custom',
          path: ['steps', index],
          message: 'Cascade step is inconsistent',
        });
      }
      previous = step.after;
    });
  });

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

export const roundResultSchema: z.ZodType<RoundResult> = z
  .object({
    requestId: z.string().min(1),
    roundId: z.string().min(1),
    status: z.literal('completed'),
    mode: z.enum(['BASE_GAME', 'FREE_SPINS']),
    spinMode: spinMode.optional(),
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
    presentation: z
      .object({
        anticipation: z
          .object({
            reelIndex: nonNegativeInteger.min(2).max(4),
            extraSpinMs: positiveInteger.max(5000),
          })
          .nullable(),
      })
      .optional(),
    cascade: cascadeSequenceSchema.optional(),
    nextAction: action,
  })
  .superRefine((result, context) => {
    const sequence = result.cascade;
    const activePaylines = result.bet.paylineCount ?? DEFAULT_PAYLINE_COUNT;
    const hasInactiveLine =
      result.wins.some((win) => win.lineId > activePaylines) ||
      sequence?.steps.some((step) => step.wins.some((win) => win.lineId > activePaylines));
    if (hasInactiveLine) {
      context.addIssue({
        code: 'custom',
        path: ['wins'],
        message: 'A win refers to an inactive payline',
      });
    }
    if (!sequence) {
      if (result.spinMode === 'CASCADE' || result.spinMode === 'HYBRID') {
        context.addIssue({
          code: 'custom',
          path: ['spinMode'],
          message: 'Cascade sequence is missing',
        });
      }
      return;
    }
    const finalGrid = sequence.steps.at(-1)?.after ?? sequence.initialReels;
    const paid = sequence.steps.reduce((sum, step) => sum + step.payoutCoins, 0);
    if (
      result.mode !== 'BASE_GAME' ||
      result.spinMode === 'CLASSIC' ||
      !sameGrid(result.reels, finalGrid) ||
      result.totalWinCoins !== paid
    ) {
      context.addIssue({
        code: 'custom',
        path: ['cascade'],
        message: 'Cascade result is inconsistent',
      });
    }
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
