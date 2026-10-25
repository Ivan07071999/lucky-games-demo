import type { GameEvents } from '../events';
import type { GameEmitter } from '../events/GameEmitter';
import type { ReelsController } from '../controllers/reels-controller/ReelsController';
import type { BalanceController } from '../controllers/balance-controller/BalanceController';
import type { WinPopupController } from '../controllers/win-popup-controller/WinPopupController';
import type { AudioController } from '../controllers/audio-controller/AudioController';
import type { SlotStore } from '../stores/SlotStore';
import type { Phase } from './PhaseManager';
import { PhaseName, type NextPhase } from './types';

export class ResultPhase implements Phase<
  typeof PhaseName.result,
  NextPhase<typeof PhaseName.result>
> {
  readonly name = PhaseName.result;
  private readonly store: SlotStore;
  private readonly emitter: GameEmitter<GameEvents>;
  private readonly reels: ReelsController;
  private readonly balance: BalanceController;
  private readonly popup: WinPopupController;
  private readonly audio?: AudioController;

  constructor(
    store: SlotStore,
    emitter: GameEmitter<GameEvents>,
    reels: ReelsController,
    balance: BalanceController,
    popup: WinPopupController,
    audio?: AudioController,
  ) {
    this.store = store;
    this.emitter = emitter;
    this.reels = reels;
    this.balance = balance;
    this.popup = popup;
    this.audio = audio;
  }

  async enter(signal: AbortSignal): Promise<NextPhase<typeof PhaseName.result>> {
    const result = this.store.round.currentRound;
    if (!result) throw new Error('Round result is missing');

    const presentation = new AbortController();
    const abortPresentation = (): void => presentation.abort(signal.reason);
    signal.addEventListener('abort', abortPresentation, { once: true });
    const unsubscribeSkipWin = this.emitter.on('ui:skipWinRequested', () => {
      if (this.store.round.requestSkipWin()) presentation.abort();
    });

    try {
      signal.throwIfAborted();
      this.store.applyRoundOutcome(result);
      this.store.round.startShowingWin();
      await this.reels.presentResult(result, presentation.signal);
      this.audio?.playWin((result.features.freeSpins.completion ?? result).winType ?? 'NO_WIN');
      await Promise.all([
        this.balance.showWin(result, presentation.signal),
        this.popup.present(result, presentation.signal),
      ]);
    } catch (error) {
      if (signal.aborted) throw error;
      if (!this.store.round.skipWinRequested) {
        console.error('Egypt slot result presentation failed', error);
      }
    } finally {
      presentation.abort();
      unsubscribeSkipWin();
      signal.removeEventListener('abort', abortPresentation);
      this.popup.hide();
      this.balance.settle(result);
      this.store.round.finishRound();
    }

    signal.throwIfAborted();
    this.emitter.emit('round:completed', result);
    if (result.mode === 'BASE_GAME' && this.store.round.isFreeSpin) {
      return PhaseName.freeSpinsIntro;
    }
    if (result.mode === 'FREE_SPINS' && !this.store.round.isFreeSpin) {
      return PhaseName.freeSpinsOutro;
    }
    return this.store.round.isFreeSpin ? PhaseName.freeSpins : PhaseName.idle;
  }
}
