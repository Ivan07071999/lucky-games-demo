import type { GameEvents } from '../events';
import type { GameEmitter } from '../events/GameEmitter';
import type { ReelsController } from '../controllers/reels-controller/ReelsController';
import type { BalanceController } from '../controllers/balance-controller/BalanceController';
import type { AudioController } from '../controllers/audio-controller/AudioController';
import type { MainSceneController } from '../controllers/main-scene-controller/MainSceneController';
import type { SlotStore } from '../stores/SlotStore';
import type { Phase } from './PhaseManager';
import { PhaseName, type NextPhase } from './types';

const WIN_REVEAL_PAUSE_MS = 300;
const POPUP_WIN_HOLD_MS = 1200;

function waitForWinReveal(signal: AbortSignal, durationMs: number): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, durationMs);
    const onAbort = (): void => {
      clearTimeout(timeout);
      signal.removeEventListener('abort', onAbort);
      reject(signal.reason ?? new Error('Win presentation skipped'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) onAbort();
  });
}

export class ResultPhase implements Phase<
  typeof PhaseName.result,
  NextPhase<typeof PhaseName.result>
> {
  readonly name = PhaseName.result;
  private readonly store: SlotStore;
  private readonly emitter: GameEmitter<GameEvents>;
  private readonly reels: ReelsController;
  private readonly balance: BalanceController;
  private readonly audio?: AudioController;
  private readonly scene?: MainSceneController;

  constructor(
    store: SlotStore,
    emitter: GameEmitter<GameEvents>,
    reels: ReelsController,
    balance: BalanceController,
    audio?: AudioController,
    scene?: MainSceneController,
  ) {
    this.store = store;
    this.emitter = emitter;
    this.reels = reels;
    this.balance = balance;
    this.audio = audio;
    this.scene = scene;
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
      this.store.round.revealWin();
      const presentedWin = result.features.freeSpins.completion ?? result;
      this.audio?.playWin(presentedWin.winType ?? 'NO_WIN');
      const popupShown = this.scene?.showWinPopup(presentedWin.winType, presentedWin.totalWinCoins);
      if (result.totalWinCoins > 0 || popupShown) {
        await waitForWinReveal(
          presentation.signal,
          popupShown ? POPUP_WIN_HOLD_MS : WIN_REVEAL_PAUSE_MS,
        );
      }
      await this.balance.showWin(result, presentation.signal);
    } catch (error) {
      if (signal.aborted) throw error;
      if (!this.store.round.skipWinRequested) {
        console.error('Egypt slot result presentation failed', error);
      }
    } finally {
      this.scene?.hideWinPopup();
      presentation.abort();
      unsubscribeSkipWin();
      signal.removeEventListener('abort', abortPresentation);
      this.store.round.revealWin();
      this.balance.settle(result);
      try {
        if (!signal.aborted && result.mode === 'BASE_GAME' && this.store.round.isFreeSpin) {
          await this.reels.presentFreeSpinsTrigger(result, signal);
        }
      } catch (error) {
        if (!signal.aborted) console.error('Free Spins trigger presentation failed', error);
      }
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
