import type { SlotApi } from '../network/SlotApi';
import type { MainSceneController } from '../controllers/main-scene-controller/MainSceneController';
import type { ReelsController } from '../controllers/reels-controller/ReelsController';
import type { SlotStore } from '../stores/SlotStore';
import type { Phase } from './PhaseManager';
import { PhaseName, type NextPhase } from './types';

export class SpinningPhase implements Phase<
  typeof PhaseName.spinning,
  NextPhase<typeof PhaseName.spinning>
> {
  readonly name = PhaseName.spinning;
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

  async enter(signal: AbortSignal): Promise<NextPhase<typeof PhaseName.spinning>> {
    signal.throwIfAborted();
    const previousReels = this.store.reels.reels;
    this.scene.clearError();
    this.store.round.startRound();

    try {
      const isFreeSpin = this.store.round.nextAction === 'FREE_SPIN';
      const bet = {
        bet: this.store.panel.bet,
        level: this.store.panel.level,
        coinValueCents: this.store.panel.coinValueCents,
      };
      const result = await this.reels.playRound(
        (requestSignal) =>
          isFreeSpin ? this.api.freeSpin(requestSignal) : this.api.spin(bet, requestSignal),
        previousReels,
        signal,
      );
      this.store.round.receiveRound(result);
      return PhaseName.result;
    } catch (error) {
      if (signal.aborted) throw error;
      const message = error instanceof Error ? error.message : 'Round failed';
      this.store.round.failRound(message);
      this.store.round.finishRound();
      this.scene.showError(message);
      return PhaseName.idle;
    }
  }
}
