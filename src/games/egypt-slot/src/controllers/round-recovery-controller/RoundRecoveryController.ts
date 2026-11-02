import type { BalanceController } from '../balance-controller/BalanceController';
import type { MainSceneController } from '../main-scene-controller/MainSceneController';
import type { ReelsController } from '../reels-controller/ReelsController';
import { ConfirmedRound } from '../round-controller/ConfirmedRound';
import type { SlotApi } from '../../network/SlotApi';
import { SlotApiError } from '../../network/SlotApiError';
import type { ReelsMatrix } from '../../reels/reelsConfig';
import type { GameMessages } from '../../runtime/GameContext';
import type { SlotStore } from '../../stores/SlotStore';

export type RecoveryOutcome =
  { kind: 'round' } | { kind: 'session'; isFreeSpin: boolean; bonusEnded: boolean };

export class RoundRecoveryController {
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

  async recover(signal: AbortSignal): Promise<RecoveryOutcome> {
    const previousReels = this.store.reels.reels;
    let rejectedRoundError: string | null = null;

    try {
      while (true) {
        signal.throwIfAborted();
        this.scene.showError(this.messages.recoveringRound);
        const hadPendingRound = this.api.hasPendingRound;
        const confirmation = new ConfirmedRound(this.store, this.reels);

        try {
          if (!hadPendingRound) return await this.reconcileSession(rejectedRoundError, signal);

          await this.recoverPendingRound(previousReels, confirmation, signal);
          rejectedRoundError = null;
          return { kind: 'round' };
        } catch (error) {
          if (signal.aborted) throw error;
          if (await confirmation.recoverPlayback(error, signal)) {
            rejectedRoundError = null;
            return { kind: 'round' };
          }

          this.balance.rollbackPendingBet();
          this.store.round.startRecovery();
          if (hadPendingRound && !this.api.hasPendingRound) {
            rejectedRoundError =
              error instanceof SlotApiError && error.code === 'NO_FREE_SPINS'
                ? null
                : error instanceof Error
                  ? error.message
                  : this.messages.recoverRoundError;
            continue;
          }

          console.warn('Egypt slot round recovery failed', error);
          await this.waitForRetry(signal);
        }
      }
    } finally {
      this.scene.clearError();
      if (
        rejectedRoundError &&
        !this.api.hasPendingRound &&
        !this.store.session.isFreeSpin &&
        !signal.aborted
      ) {
        this.scene.showError(rejectedRoundError);
      }
    }
  }

  private async recoverPendingRound(
    previousReels: ReelsMatrix,
    confirmation: ConfirmedRound,
    signal: AbortSignal,
  ): Promise<void> {
    const result = await this.reels.playRound(
      (requestSignal) => this.api.recoverPendingRound(requestSignal),
      previousReels,
      confirmation.confirm,
      signal,
      this.api.pendingSpinMode,
    );
    this.store.round.receiveRound(result);
  }

  private async reconcileSession(
    rejectedRoundError: string | null,
    signal: AbortSignal,
  ): Promise<RecoveryOutcome> {
    const state = await this.api.getState(signal);
    signal.throwIfAborted();
    const wasBonusRound = this.store.round.isBonusRound;
    this.store.reconcileState(state);
    const isFreeSpin = this.store.session.isFreeSpin;
    const bonusEnded = wasBonusRound && !isFreeSpin;
    if (!bonusEnded) this.scene.setTheme(isFreeSpin ? 'freeSpins' : 'base');
    if (rejectedRoundError && !isFreeSpin) this.store.round.failRound(rejectedRoundError);
    return { kind: 'session', isFreeSpin, bonusEnded };
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
