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
