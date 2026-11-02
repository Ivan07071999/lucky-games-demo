import type { RoundResult } from '@lucky-games/contracts';
import type { SlotStore } from '../../stores/SlotStore';
import type { ReelsController } from '../reels-controller/ReelsController';

export class ConfirmedRound {
  private readonly store: SlotStore;
  private readonly reels: ReelsController;
  private result: RoundResult | null = null;
  private betApplied = false;

  constructor(store: SlotStore, reels: ReelsController) {
    this.store = store;
    this.reels = reels;
  }

  readonly confirm = (result: RoundResult): void => {
    this.result = result;
    this.store.round.receiveRound(result);
    this.applyBet(result);
  };

  async recoverPlayback(error: unknown, signal: AbortSignal): Promise<RoundResult | null> {
    if (!this.result) return null;
    signal.throwIfAborted();

    console.error('Confirmed round playback failed', error);
    if (!this.betApplied) {
      try {
        this.applyBet(this.result);
      } catch (applyError) {
        // The confirmed result must reach ResultPhase even if this update fails.
        console.error('Failed to apply confirmed bet', applyError);
      }
    }

    try {
      await this.reels.restoreFinalReels(this.result, signal);
    } catch (restoreError) {
      signal.throwIfAborted();
      console.error('Failed to restore confirmed reels', restoreError);
    }

    return this.result;
  }

  private applyBet(result: RoundResult): void {
    this.store.applyConfirmedBet(result);
    this.betApplied = true;
  }
}
