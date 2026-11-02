import type { RoundResult } from '@lucky-games/contracts';
import type { BalanceStore } from '../../stores/BalanceStore';

const WIN_COUNT_DURATION_MS = 900;

export class BalanceController {
  private readonly balance: BalanceStore;

  constructor(balance: BalanceStore) {
    this.balance = balance;
  }

  showPendingBet(totalBetCoins: number): void {
    this.balance.setDisplayBalanceCoins(this.balance.balanceCoins - totalBetCoins);
  }

  rollbackPendingBet(): void {
    this.balance.setDisplayBalanceCoins(this.balance.balanceCoins);
  }

  async showWin(result: RoundResult, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();

    const { afterBet, afterWin } = result.balance;
    if (afterWin <= afterBet) {
      this.balance.setDisplayBalanceCoins(afterWin);
      return;
    }

    this.balance.setDisplayBalanceCoins(afterBet);
    await this.animateBalance(afterBet, afterWin, signal);
  }

  settle(result: RoundResult): void {
    this.balance.applyRoundResult(result);
  }

  private animateBalance(from: number, to: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const startedAt = performance.now();
      let frameId = 0;

      const cleanup = (): void => {
        cancelAnimationFrame(frameId);
        signal.removeEventListener('abort', handleAbort);
      };

      const handleAbort = (): void => {
        cleanup();
        reject(signal.reason);
      };

      const update = (timestamp: number): void => {
        const progress = Math.min((timestamp - startedAt) / WIN_COUNT_DURATION_MS, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const balance = Math.floor(from + (to - from) * easedProgress);

        this.balance.setDisplayBalanceCoins(balance);

        if (progress < 1) {
          frameId = requestAnimationFrame(update);
          return;
        }

        cleanup();
        this.balance.setDisplayBalanceCoins(to);
        resolve();
      };

      signal.addEventListener('abort', handleAbort, { once: true });
      frameId = requestAnimationFrame(update);
    });
  }
}
