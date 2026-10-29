import type { BalanceController } from '../controllers/balance-controller/BalanceController';
import type { MainSceneController } from '../controllers/main-scene-controller/MainSceneController';
import type { ReelsController } from '../controllers/reels-controller/ReelsController';
import type { SlotApi } from '../network/SlotApi';
import type { GameMessages } from '../runtime/GameContext';
import type { SlotStore } from '../stores/SlotStore';
import type { Phase } from './PhaseManager';
import { PhaseName, type NextPhase } from './types';

export class RecoveringPhase implements Phase<
  typeof PhaseName.recovering,
  NextPhase<typeof PhaseName.recovering>
> {
  readonly name = PhaseName.recovering;
  private readonly api: SlotApi;
  private readonly store: SlotStore;
  private readonly scene: MainSceneController;
  private readonly reels: ReelsController;
  private readonly balance: BalanceController;
  private readonly messages: GameMessages;

  constructor(
    api: SlotApi,
    store: SlotStore,
    scene: MainSceneController,
    reels: ReelsController,
    balance: BalanceController,
    messages: GameMessages,
  ) {
    this.api = api;
    this.store = store;
    this.scene = scene;
    this.reels = reels;
    this.balance = balance;
    this.messages = messages;
  }

  async enter(signal: AbortSignal): Promise<NextPhase<typeof PhaseName.recovering>> {
    signal.throwIfAborted();
    if (this.store.round.stage !== 'recovering') {
      this.store.round.startRecovery(this.api.pendingAction === 'FREE_SPIN');
    }

    const previousReels = this.store.reels.reels;
    let knownFailure: string | null = null;

    try {
      while (true) {
        signal.throwIfAborted();
        this.scene.showError(this.messages.recoveringRound);
        const hadPendingRound = this.api.hasPendingRound;

        try {
          if (!hadPendingRound) {
            const state = await this.api.getState(signal);
            signal.throwIfAborted();
            this.store.reconcileState(state);
            this.scene.setTheme(this.store.round.isFreeSpin ? 'freeSpins' : 'base');
            if (knownFailure && !this.store.round.isFreeSpin) {
              this.store.round.failRound(knownFailure);
            }
            return this.store.round.isFreeSpin ? PhaseName.freeSpins : PhaseName.idle;
          }

          const result = await this.reels.playRound(
            (requestSignal) => this.api.recoverPendingRound(requestSignal),
            previousReels,
            (confirmedResult) => this.balance.showConfirmedBet(confirmedResult),
            signal,
            this.api.pendingCascadeMode,
          );
          this.store.round.receiveRound(result);
          return PhaseName.result;
        } catch (error) {
          this.balance.rollbackPendingBet();
          if (signal.aborted) throw error;
          this.store.round.startRecovery();
          if (hadPendingRound && !this.api.hasPendingRound) {
            knownFailure = error instanceof Error ? error.message : this.messages.recoverRoundError;
            continue;
          }
          console.warn('Egypt slot round recovery failed', error);
          await this.waitForRetry(signal);
        }
      }
    } finally {
      this.scene.clearError();
      if (
        knownFailure &&
        !this.api.hasPendingRound &&
        !this.store.round.isFreeSpin &&
        !signal.aborted
      ) {
        this.scene.showError(knownFailure);
      }
    }
  }

  private waitForRetry(signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const onRetry = (): void => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      };
      const onAbort = (): void => {
        signal.removeEventListener('abort', onAbort);
        reject(signal.reason ?? new Error('Round recovery cancelled'));
      };
      this.scene.showError(this.messages.recoverRoundError, this.messages.retry, onRetry);
      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted) onAbort();
    });
  }
}
