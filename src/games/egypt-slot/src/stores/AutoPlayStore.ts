import type { RoundResult } from '@lucky-games/contracts';
import { makeAutoObservable, observableRef } from 'mobx';
import type { SpinOptions } from '../network/SlotApi';

export const AUTO_PLAY_COUNTS = [10, 25, 50, 100] as const;

export type AutoPlayState =
  | 'inactive'
  | 'configuring'
  | 'running'
  | 'stopRequested'
  | 'pausedForBonus'
  | 'recovering'
  | 'completed';

export class AutoPlayStore {
  state: AutoPlayState = 'inactive';
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
      this.state === 'running' ||
      this.state === 'stopRequested' ||
      this.state === 'pausedForBonus' ||
      this.state === 'recovering'
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
    this.state = 'running';
    return true;
  }

  markRoundStarted(): boolean {
    if (this.state !== 'running' || this.activeRound || this.remaining === 0) return false;
    this.activeRound = true;
    return true;
  }

  requestStop(): void {
    if (this.state === 'running') {
      this.state = this.activeRound ? 'stopRequested' : 'inactive';
    } else if (this.state === 'pausedForBonus' || this.state === 'recovering') {
      this.state = 'inactive';
    }
  }

  completeRound(result: RoundResult): void {
    if (!this.activeRound) return;
    this.activeRound = false;
    if (result.mode !== 'BASE_GAME') {
      this.state = 'recovering';
      return;
    }

    this.completed += 1;
    const bet = this.lockedBet;
    if (
      this.state === 'stopRequested' ||
      !bet ||
      result.bet.bet !== bet.bet ||
      result.bet.level !== bet.level ||
      result.bet.coinValueCents !== bet.coinValueCents
    ) {
      this.state = 'inactive';
    } else if (this.remaining === 0) {
      this.state = 'completed';
    } else if (result.nextAction === 'FREE_SPIN') {
      this.state = this.stopOnFreeSpins ? 'inactive' : 'pausedForBonus';
    } else if (
      (this.stopOnWin && result.totalWinCoins > 0) ||
      this.reachedBalanceLimit(result.balance.afterWin) ||
      result.balance.afterWin < bet.bet * bet.level
    ) {
      this.state = 'inactive';
    }
  }

  resumeAfterBonus(): void {
    if (this.state === 'pausedForBonus') this.state = 'running';
  }

  reachedBalanceLimit(balanceCoins: number): boolean {
    return (
      (this.netLossLimitCoins !== null &&
        this.initialBalanceCoins - balanceCoins >= this.netLossLimitCoins) ||
      (this.netWinLimitCoins !== null &&
        balanceCoins - this.initialBalanceCoins >= this.netWinLimitCoins)
    );
  }

  failRound(): void {
    if (!this.activeRound) return;
    this.activeRound = false;
    this.state = 'recovering';
  }

  reset(): void {
    this.state = 'inactive';
    this.total = 0;
    this.completed = 0;
    this.activeRound = false;
    this.lockedBet = null;
  }

  private validLimit(limit: number | null): boolean {
    return limit === null || (Number.isSafeInteger(limit) && limit > 0);
  }
}
