import type { RoundResult } from '@lucky-games/contracts';
import { makeAutoObservable, observableRef } from 'mobx';
import type { SpinOptions } from '../network/SlotApi';

export const AUTO_PLAY_COUNTS = [10, 25, 50, 100] as const;

export type AutoPlayState =
  'inactive' | 'configuring' | 'running' | 'stopRequested' | 'pausedForBonus' | 'completed';

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

export class AutoPlayStore {
  state: AutoPlayState = 'inactive';
  stopReason: AutoPlayStopReason | null = null;
  selectedSpins: (typeof AUTO_PLAY_COUNTS)[number] = 25;
  stopOnFreeSpins = true;
  stopOnWin = false;
  netLossLimitCoins: number | null = null;
  netWinLimitCoins: number | null = null;
  total = 0;
  completed = 0;
  activeRound = false;
  lockedBet: SpinOptions | null = null;
  initialBalanceCoins = 0;

  constructor() {
    makeAutoObservable(this, { lockedBet: observableRef }, { autoBind: true });
  }

  get remaining(): number {
    return Math.max(0, this.total - this.completed);
  }

  get isBetLocked(): boolean {
    return (
      this.state === 'running' || this.state === 'stopRequested' || this.state === 'pausedForBonus'
    );
  }

  get canConfigure(): boolean {
    return this.state === 'inactive' || this.state === 'completed';
  }

  openConfig(): boolean {
    if (!this.canConfigure) return false;
    this.state = 'configuring';
    return true;
  }

  closeConfig(): void {
    if (this.state === 'configuring') this.state = 'inactive';
  }

  selectSpins(count: (typeof AUTO_PLAY_COUNTS)[number]): void {
    if (this.state === 'configuring' && AUTO_PLAY_COUNTS.includes(count)) {
      this.selectedSpins = count;
    }
  }

  setStopOnFreeSpins(enabled: boolean): void {
    if (this.state === 'configuring') this.stopOnFreeSpins = enabled;
  }

  setStopOnWin(enabled: boolean): void {
    if (this.state === 'configuring') this.stopOnWin = enabled;
  }

  setNetLossLimitCoins(limit: number | null): void {
    if (this.state === 'configuring' && this.validLimit(limit)) this.netLossLimitCoins = limit;
  }

  setNetWinLimitCoins(limit: number | null): void {
    if (this.state === 'configuring' && this.validLimit(limit)) this.netWinLimitCoins = limit;
  }

  start(bet: SpinOptions, balanceCoins: number): boolean {
    if (this.state !== 'configuring') return false;
    const totalBetCoins = bet.bet * bet.level;
    if (balanceCoins < totalBetCoins) return false;

    this.lockedBet = { ...bet };
    this.initialBalanceCoins = balanceCoins;
    this.total = this.selectedSpins;
    this.completed = 0;
    this.activeRound = false;
    this.stopReason = null;
    this.state = 'running';
    return true;
  }

  cancelStart(): void {
    if (this.state !== 'running' || this.activeRound) return;
    this.state = 'configuring';
    this.stopReason = null;
    this.total = 0;
    this.completed = 0;
    this.lockedBet = null;
    this.initialBalanceCoins = 0;
  }

  markRoundStarted(): boolean {
    if (this.state !== 'running' || this.activeRound || this.remaining === 0) return false;
    this.activeRound = true;
    return true;
  }

  requestStop(): void {
    this.stop('manual');
  }

  stop(reason: AutoPlayStopReason): void {
    if (this.state !== 'running' && this.state !== 'pausedForBonus') return;
    this.stopReason = reason;
    this.state = this.activeRound ? 'stopRequested' : 'inactive';
  }

  completeRound(result: RoundResult): void {
    if (!this.activeRound) return;
    this.activeRound = false;
    if (result.mode !== 'BASE_GAME') {
      this.finish('roundError');
      return;
    }

    this.completed += 1;
    const bet = this.lockedBet;
    if (this.state === 'stopRequested') {
      this.finish(this.stopReason ?? 'manual');
      return;
    }
    if (!bet || result.bet.bet !== bet.bet || result.bet.level !== bet.level) {
      this.finish('betMismatch');
      return;
    }
    if (this.remaining === 0) {
      this.state = 'completed';
      this.stopReason = 'completed';
      return;
    }
    if (this.stopOnWin && result.totalWinCoins > 0) {
      this.finish('win');
      return;
    }

    const balanceLimit = this.balanceLimitReason(result.balance.afterWin);
    if (balanceLimit) {
      this.finish(balanceLimit);
      return;
    }
    if (result.nextAction === 'FREE_SPIN') {
      if (this.stopOnFreeSpins) this.finish('freeSpins');
      else this.state = 'pausedForBonus';
      return;
    }
    if (result.balance.afterWin < bet.bet * bet.level) {
      this.finish('insufficientBalance');
    }
  }

  resumeAfterBonus(): void {
    if (this.state === 'pausedForBonus') this.state = 'running';
  }

  balanceLimitReason(balanceCoins: number): BalanceLimitReason | null {
    if (
      this.netLossLimitCoins !== null &&
      this.initialBalanceCoins - balanceCoins >= this.netLossLimitCoins
    ) {
      return 'netLossLimit';
    }
    if (
      this.netWinLimitCoins !== null &&
      balanceCoins - this.initialBalanceCoins >= this.netWinLimitCoins
    ) {
      return 'netWinLimit';
    }
    return null;
  }

  failRound(): void {
    if (!this.activeRound) return;
    this.activeRound = false;
    this.finish(this.state === 'stopRequested' ? (this.stopReason ?? 'manual') : 'roundError');
  }

  reset(): void {
    this.state = 'inactive';
    this.total = 0;
    this.completed = 0;
    this.activeRound = false;
    this.lockedBet = null;
    this.initialBalanceCoins = 0;
    this.stopReason = null;
  }

  private finish(reason: AutoPlayStopReason): void {
    this.state = 'inactive';
    this.stopReason = reason;
  }

  private validLimit(limit: number | null): boolean {
    return limit === null || (Number.isSafeInteger(limit) && limit > 0);
  }
}
