import type { SlotApi } from '../network/SlotApi';
import type { MainSceneController } from '../controllers/main-scene-controller/MainSceneController';
import type { ReelsController } from '../controllers/reels-controller/ReelsController';
import type { BalanceController } from '../controllers/balance-controller/BalanceController';
import type { AutoPlayController } from '../controllers/auto-play-controller/AutoPlayController';
import type { SlotStore } from '../stores/SlotStore';
import { ConfirmedRound } from '../controllers/round-controller/ConfirmedRound';
import type { Phase } from '../fsm/PhaseManager';
import { buildSpinOptions } from '../runtime/buildSpinOptions';
import { PhaseName, type NextPhase } from '../fsm/transitions';

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
    const spinMode = this.store.spinSettings.spinMode;
    const bet = buildSpinOptions(this.store, spinMode);
    const confirmation = new ConfirmedRound(this.store, this.reels);
    this.scene.clearError();
    this.balance.showPendingBet(bet.bet * bet.level);

    try {
      const result = await this.reels.playRound(
        (requestSignal) => this.api.spin(bet, requestSignal),
        previousReels,
        confirmation.confirm,
        signal,
        spinMode,
      );
      this.store.round.receiveRound(result);
      return PhaseName.result;
    } catch (error) {
      return this.handleFailedRound(error, confirmation, signal);
    }
  }

  private async handleFailedRound(
    error: unknown,
    confirmation: ConfirmedRound,
    signal: AbortSignal,
  ): Promise<NextPhase<typeof PhaseName.spinning>> {
    if (signal.aborted) throw error;
    if (await confirmation.recoverPlayback(error, signal)) return PhaseName.result;

    this.balance.rollbackPendingBet();
    if (this.api.hasPendingRound) {
      this.store.round.startRecovery();
      return PhaseName.recovering;
    }

    this.autoPlay.onRoundFailed();
    const message = error instanceof Error ? error.message : 'Round failed';
    this.store.round.failRound(message);
    this.store.round.finishRound();
    this.scene.showError(message);
    return PhaseName.idle;
  }
}
