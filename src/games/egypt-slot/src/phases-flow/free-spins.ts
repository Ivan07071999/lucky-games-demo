import type { BalanceController } from '../controllers/balance-controller/BalanceController';
import type { MainSceneController } from '../controllers/main-scene-controller/MainSceneController';
import type { ReelsController } from '../controllers/reels-controller/ReelsController';
import type { SlotApi } from '../network/SlotApi';
import type { SlotStore } from '../stores/SlotStore';
import type { Phase } from './PhaseManager';
import { PhaseName, type NextPhase } from './types';

export class FreeSpinsPhase implements Phase<
  typeof PhaseName.freeSpins,
  NextPhase<typeof PhaseName.freeSpins>
> {
  readonly name = PhaseName.freeSpins;
  private readonly api: SlotApi;
  private readonly store: SlotStore;
  private readonly scene: MainSceneController;
  private readonly reels: ReelsController;
  private readonly balance: BalanceController;

  constructor(
    api: SlotApi,
    store: SlotStore,
    scene: MainSceneController,
    reels: ReelsController,
    balance: BalanceController,
  ) {
    this.api = api;
    this.store = store;
    this.scene = scene;
    this.reels = reels;
    this.balance = balance;
  }

  async enter(signal: AbortSignal): Promise<NextPhase<typeof PhaseName.freeSpins>> {
    signal.throwIfAborted();
    if (!this.store.round.isFreeSpin) {
      throw new Error('Free Spins phase entered without available spins');
    }

    const previousReels = this.store.reels.reels;
    this.scene.clearError();
    if (this.store.round.stage === 'idle') this.store.round.startRound();

    try {
      const result = await this.reels.playRound(
        (requestSignal) => this.api.freeSpin(requestSignal),
        previousReels,
        (confirmedResult) => this.balance.showConfirmedBet(confirmedResult),
        signal,
      );
      this.store.round.receiveRound(result);
      return PhaseName.result;
    } catch (error) {
      this.balance.rollbackPendingBet();
      if (signal.aborted) throw error;
      const message = error instanceof Error ? error.message : 'Free spin failed';
      this.store.round.failRound(message);
      this.store.round.finishRound();
      this.scene.showError(message);
      return PhaseName.idle;
    }
  }
}
