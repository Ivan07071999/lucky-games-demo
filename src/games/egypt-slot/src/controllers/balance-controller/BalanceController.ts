import type { RoundResult } from '@lucky-games/contracts';
import type { PanelStore } from '../../stores/PanelStore';

const WIN_COUNT_DURATION_MS = 900;

export class BalanceController {
  private readonly panel: PanelStore;
  private balanceBeforeSpin: number | null = null;

  constructor(panel: PanelStore) {
    this.panel = panel;
  }

  showPendingBet(totalBetCoins: number): void {
    this.balanceBeforeSpin = this.panel.balanceCoins;
    this.panel.setBalanceCoins(this.panel.balanceCoins - totalBetCoins);
  }

  showConfirmedBet(result: RoundResult): void {
    this.balanceBeforeSpin = null;
    this.panel.applyConfirmedBet(result);
  }

  rollbackPendingBet(): void {
    if (this.balanceBeforeSpin === null) return;

    this.panel.setBalanceCoins(this.balanceBeforeSpin);
    this.balanceBeforeSpin = null;
  }

  async showWin(result: RoundResult, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();

    const { afterBet, afterWin } = result.balance;
    if (afterWin <= afterBet) {
      this.panel.setBalanceCoins(afterWin);
      return;
    }

    this.panel.setBalanceCoins(afterBet);
    await this.animateBalance(afterBet, afterWin, signal);
  }

  settle(result: RoundResult): void {
    this.balanceBeforeSpin = null;
    this.panel.applyRoundResult(result);
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

        this.panel.setBalanceCoins(balance);

        if (progress < 1) {
          frameId = requestAnimationFrame(update);
          return;
        }

        cleanup();
        this.panel.setBalanceCoins(to);
        resolve();
      };

      signal.addEventListener('abort', handleAbort, { once: true });
      frameId = requestAnimationFrame(update);
    });
  }
}
