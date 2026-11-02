import type { MainSceneController } from '../controllers/main-scene-controller/MainSceneController';
import type { ReelsController } from '../controllers/reels-controller/ReelsController';
import { ConfirmedRound } from '../controllers/round-controller/ConfirmedRound';
import type { SlotApi } from '../network/SlotApi';
import { SlotApiError } from '../network/SlotApiError';
import type { SlotStore } from '../stores/SlotStore';
import type { Phase } from '../fsm/PhaseManager';
import { PhaseName, type NextPhase } from '../fsm/transitions';

export class FreeSpinsPhase implements Phase<
  typeof PhaseName.freeSpins,
  NextPhase<typeof PhaseName.freeSpins>
> {
  readonly name = PhaseName.freeSpins;
  private readonly api: SlotApi;
  private readonly store: SlotStore;
  private readonly scene: MainSceneController;
  private readonly reels: ReelsController;

  constructor(api: SlotApi, store: SlotStore, scene: MainSceneController, reels: ReelsController) {
    this.api = api;
    this.store = store;
    this.scene = scene;
    this.reels = reels;
  }

  async enter(signal: AbortSignal): Promise<NextPhase<typeof PhaseName.freeSpins>> {
    signal.throwIfAborted();
    this.prepareRound();

    const confirmation = new ConfirmedRound(this.store, this.reels);
    try {
      await this.reels.playRound(
        (requestSignal) => this.api.freeSpin(requestSignal),
        this.store.reels.reels,
        confirmation.confirm,
        signal,
      );
      return PhaseName.result;
    } catch (error) {
      return this.handleFailedRound(error, confirmation, signal);
    }
  }

  private prepareRound(): void {
    if (!this.store.session.isFreeSpin) {
      throw new Error('Free Spins phase entered without available spins');
    }
    if (this.store.round.stage === 'idle') {
      this.store.round.startRound();
    } else if (this.store.round.stage !== 'waitingResult') {
      throw new Error(`Free Spins phase entered during ${this.store.round.stage}`);
    }
    this.scene.clearError();
  }

  private async handleFailedRound(
    error: unknown,
    confirmation: ConfirmedRound,
    signal: AbortSignal,
  ): Promise<NextPhase<typeof PhaseName.freeSpins>> {
    if (signal.aborted) throw error;
    if (await confirmation.recoverPlayback(error, signal)) return PhaseName.result;

    if (
      this.api.hasPendingRound ||
      (error instanceof SlotApiError && error.code === 'NO_FREE_SPINS')
    ) {
      this.store.round.startRecovery();
      return PhaseName.recovering;
    }

    const message = error instanceof Error ? error.message : 'Free spin failed';
    this.store.round.failRound(message);
    this.store.round.finishRound();
    this.scene.showError(message);
    return PhaseName.idle;
  }
}
