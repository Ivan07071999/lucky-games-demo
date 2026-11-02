import type { RoundResult, SpinOptions } from '@lucky-games/contracts';
import { makeAutoObservable, observableRef } from 'mobx';
import { getCompletedRoundDecision, type AutoPlayStopReason } from './autoPlayPolicy';

export type { AutoPlayStopReason } from './autoPlayPolicy';

export const AUTO_PLAY_COUNTS = [10, 25, 50, 100] as const;

export type AutoPlayState =
  'inactive' | 'configuring' | 'running' | 'stopRequested' | 'pausedForBonus' | 'completed';

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
    if (result.mode === 'BASE_GAME') this.completed += 1;

    const decision = getCompletedRoundDecision(result, {
      lockedBet: this.lockedBet,
      remainingSpins: this.remaining,
      requestedStopReason: this.state === 'stopRequested' ? (this.stopReason ?? 'manual') : null,
      stopOnWin: this.stopOnWin,
      stopOnFreeSpins: this.stopOnFreeSpins,
      initialBalanceCoins: this.initialBalanceCoins,
      netLossLimitCoins: this.netLossLimitCoins,
      netWinLimitCoins: this.netWinLimitCoins,
    });

    if (decision === 'completed') {
      this.state = 'completed';
      this.stopReason = 'completed';
      return;
    }
    if (decision === 'pausedForBonus') {
      this.state = 'pausedForBonus';
      return;
    }
    if (decision) this.finish(decision);
  }

  resumeAfterBonus(): void {
    if (this.state === 'pausedForBonus') this.state = 'running';
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
