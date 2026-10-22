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
export type ReelGrid = [SymbolKey[], SymbolKey[], SymbolKey[], SymbolKey[], SymbolKey[]];
export type Position = [reelIndex: number, rowIndex: number];
export type GameAction = 'SPIN' | 'FREE_SPIN';
export type NextAction = GameAction;

export interface Bet {
  bet: number;
  level: number;
  coinValue: number;
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
  animations: string[];
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
    coinValues: number[];
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
      coinValue: number;
    }
  | { type: 'FREE_SPIN'; sessionId: string; requestId: string };

export type SlotMessage =
  | { type: 'ROUND_RESULT'; requestId: string; result: RoundResult }
  | { type: 'ERROR'; requestId: string | null; code: string; message: string };
