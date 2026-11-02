import type { RoundResult } from '@lucky-games/contracts';
import type { GameEvents } from '../../events';
import type { GameEmitter } from '../../events/GameEmitter';
import type { RoundStore } from '../../stores/RoundStore';
import type { AudioController } from '../audio-controller/AudioController';
import type { BalanceController } from '../balance-controller/BalanceController';
import type { MainSceneController } from '../main-scene-controller/MainSceneController';
import type { ReelsController } from '../reels-controller/ReelsController';

const WIN_REVEAL_PAUSE_MS = 300;
const POPUP_WIN_HOLD_MS = 1200;

export class ResultPresentationController {
  private readonly round: RoundStore;
  private readonly emitter: GameEmitter<GameEvents>;
  private readonly reels: ReelsController;
  private readonly balance: BalanceController;
  private readonly audio: AudioController;
  private readonly scene: MainSceneController;

  constructor(
    round: RoundStore,
    emitter: GameEmitter<GameEvents>,
    reels: ReelsController,
    balance: BalanceController,
    audio: AudioController,
    scene: MainSceneController,
  ) {
    this.round = round;
    this.emitter = emitter;
    this.reels = reels;
    this.balance = balance;
    this.audio = audio;
    this.scene = scene;
  }

  async presentWin(result: RoundResult, signal: AbortSignal): Promise<void> {
    const presentation = this.startPresentation(signal);

    try {
      signal.throwIfAborted();
      await this.reels.presentResult(result, presentation.signal);
      this.round.revealWin();
      await this.showCelebration(result, presentation.signal);
      await this.balance.showWin(result, presentation.signal);
    } catch (error) {
      if (signal.aborted) throw error;
      if (!this.round.skipWinRequested) {
        console.error('Egypt slot result presentation failed', error);
      }
    } finally {
      presentation.dispose();
      try {
        this.scene.hideWinPopup();
      } catch (error) {
        console.error('Egypt slot win popup cleanup failed', error);
      }
    }
  }

  async presentFreeSpinsTrigger(result: RoundResult, signal: AbortSignal): Promise<void> {
    if (signal.aborted || result.mode !== 'BASE_GAME' || !this.round.session.isFreeSpin) return;
    try {
      await this.reels.presentFreeSpinsTrigger(result, signal);
    } catch (error) {
      if (!signal.aborted) console.error('Free Spins trigger presentation failed', error);
    }
  }

  private startPresentation(signal: AbortSignal): { signal: AbortSignal; dispose: () => void } {
    const controller = new AbortController();
    const onAbort = (): void => controller.abort(signal.reason);
    const unsubscribeSkipWin = this.emitter.on('ui:skipWinRequested', () => {
      if (this.round.requestSkipWin()) controller.abort();
    });

    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) onAbort();

    return {
      signal: controller.signal,
      dispose: () => {
        controller.abort();
        unsubscribeSkipWin();
        signal.removeEventListener('abort', onAbort);
      },
    };
  }

  private async showCelebration(result: RoundResult, signal: AbortSignal): Promise<void> {
    const presentedWin = result.features.freeSpins.completion ?? result;
    this.audio.playWin(presentedWin.winType ?? 'NO_WIN');
    const popupShown = this.scene.showWinPopup(presentedWin.winType, presentedWin.totalWinCoins);
    if (result.totalWinCoins > 0 || popupShown) {
      await waitForWinReveal(signal, popupShown ? POPUP_WIN_HOLD_MS : WIN_REVEAL_PAUSE_MS);
    }
  }
}

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
