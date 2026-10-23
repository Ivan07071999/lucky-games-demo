import type { SlotApi } from '../network/SlotApi';
import type { MainSceneController } from '../controllers/main-scene-controller/MainSceneController';
import type { ReelsController } from '../controllers/reels-controller/ReelsController';
import type { BalanceController } from '../controllers/balance-controller/BalanceController';
import type { AutoPlayController } from '../controllers/auto-play-controller/AutoPlayController';
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
  private readonly balance: BalanceController;
  private readonly autoPlay: AutoPlayController;

  constructor(
    api: SlotApi,
    store: SlotStore,
    scene: MainSceneController,
    reels: ReelsController,
    balance: BalanceController,
    autoPlay: AutoPlayController,
  ) {
    this.api = api;
    this.store = store;
    this.scene = scene;
    this.reels = reels;
    this.balance = balance;
    this.autoPlay = autoPlay;
  }

  async enter(signal: AbortSignal): Promise<NextPhase<typeof PhaseName.spinning>> {
    signal.throwIfAborted();
    const previousReels = this.store.reels.reels;
    this.scene.clearError();

    try {
      const isFreeSpin = this.store.round.isFreeSpin;
      if (!isFreeSpin) this.balance.showPendingBet(this.store.panel.totalBetCoins);

      const bet = {
        bet: this.store.panel.bet,
        level: this.store.panel.level,
        coinValueCents: this.store.panel.coinValueCents,
      };
      const result = await this.reels.playRound(
        (requestSignal) =>
          isFreeSpin ? this.api.freeSpin(requestSignal) : this.api.spin(bet, requestSignal),
        previousReels,
        (confirmedResult) => this.balance.showConfirmedBet(confirmedResult),
        signal,
      );
      this.store.round.receiveRound(result);
      return PhaseName.result;
    } catch (error) {
      this.balance.rollbackPendingBet();
      if (signal.aborted) throw error;
      this.autoPlay.onRoundFailed();
      const message = error instanceof Error ? error.message : 'Round failed';
      this.store.round.failRound(message);
      this.store.round.finishRound();
      this.scene.showError(message);
      return PhaseName.idle;
    }
  }
}
