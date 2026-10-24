import type { RoundResult } from '@lucky-games/contracts';
import { isPopupWinType } from '../../components/win-popup/winPopupConfig';
import type { MainSceneController } from '../main-scene-controller/MainSceneController';

const POPUP_DISPLAY_MS = 1800;

export class WinPopupController {
  private readonly scene: MainSceneController;

  constructor(scene: MainSceneController) {
    this.scene = scene;
  }

  async present(result: RoundResult, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();

    const win = result.features.freeSpins.completion ?? result;
    if (!win.winType || !isPopupWinType(win.winType)) return;
    if (!Number.isSafeInteger(win.totalWinCoins) || win.totalWinCoins <= 0) return;

    this.scene.showWinPopup(win.winType, win.totalWinCoins);
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          signal.removeEventListener('abort', onAbort);
          resolve();
        }, POPUP_DISPLAY_MS);
        const onAbort = (): void => {
          clearTimeout(timeout);
          signal.removeEventListener('abort', onAbort);
          reject(signal.reason ?? new Error('Win popup presentation aborted'));
        };
        signal.addEventListener('abort', onAbort, { once: true });
        if (signal.aborted) onAbort();
      });
    } finally {
      this.hide();
    }
  }

  hide(): void {
    this.scene.hideWinPopup();
  }
}
