import type { RoundResult, SpinOptions } from '@lucky-games/contracts';

export type LockedBet = Readonly<Pick<SpinOptions, 'bet' | 'level'>>;

export type AutoPlayStopReason =
  | 'manual'
  | 'completed'
  | 'freeSpins'
  | 'win'
  | 'netLossLimit'
  | 'netWinLimit'
  | 'insufficientBalance'
  | 'betMismatch'
  | 'roundError'
  | 'unavailable';

type BalanceLimitReason = 'netLossLimit' | 'netWinLimit';

interface BalanceLimits {
  initialBalanceCoins: number;
  netLossLimitCoins: number | null;
  netWinLimitCoins: number | null;
}

interface CompletedRoundOptions extends BalanceLimits {
  lockedBet: LockedBet | null;
  remainingSpins: number;
  requestedStopReason: AutoPlayStopReason | null;
  stopOnWin: boolean;
  stopOnFreeSpins: boolean;
}

interface NextSpinOptions extends BalanceLimits {
  lockedBet: LockedBet | null;
  currentBet: LockedBet;
  balanceCoins: number;
  canPlaceBet: boolean;
  hasRoundError: boolean;
}

function getBalanceLimitReason(
  balanceCoins: number,
  limits: BalanceLimits,
): BalanceLimitReason | null {
  if (
    limits.netLossLimitCoins !== null &&
    limits.initialBalanceCoins - balanceCoins >= limits.netLossLimitCoins
  ) {
    return 'netLossLimit';
  }
  if (
    limits.netWinLimitCoins !== null &&
    balanceCoins - limits.initialBalanceCoins >= limits.netWinLimitCoins
  ) {
    return 'netWinLimit';
  }
  return null;
}

export function getCompletedRoundDecision(
  result: RoundResult,
  options: CompletedRoundOptions,
): AutoPlayStopReason | 'pausedForBonus' | null {
  if (result.mode !== 'BASE_GAME') return 'roundError';
  if (options.requestedStopReason) return options.requestedStopReason;

  const bet = options.lockedBet;
  if (!bet || result.bet.bet !== bet.bet || result.bet.level !== bet.level) return 'betMismatch';
  if (options.remainingSpins === 0) return 'completed';
  if (options.stopOnWin && result.totalWinCoins > 0) return 'win';

  const balanceLimit = getBalanceLimitReason(result.balance.afterWin, options);
  if (balanceLimit) return balanceLimit;

  if (result.nextAction === 'FREE_SPIN') {
    return options.stopOnFreeSpins ? 'freeSpins' : 'pausedForBonus';
  }
  if (result.balance.afterWin < bet.bet * bet.level) return 'insufficientBalance';
  return null;
}

export function getNextSpinStopReason(options: NextSpinOptions): AutoPlayStopReason | null {
  if (options.hasRoundError) return 'roundError';

  const balanceLimit = getBalanceLimitReason(options.balanceCoins, options);
  if (balanceLimit) return balanceLimit;

  const bet = options.lockedBet;
  if (!bet || options.currentBet.bet !== bet.bet || options.currentBet.level !== bet.level) {
    return 'betMismatch';
  }
  if (options.balanceCoins < bet.bet * bet.level) return 'insufficientBalance';
  if (!options.canPlaceBet) return 'unavailable';
  return null;
}
