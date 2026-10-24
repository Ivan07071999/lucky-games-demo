import type { MainSceneController } from '../main-scene-controller/MainSceneController';
import type { SceneTheme } from '../../scene/sceneTheme';

const FADE_SECONDS = 0.45;
const HOLD_MS = 1600;

function hold(signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, HOLD_MS);
    const onAbort = (): void => {
      clearTimeout(timeout);
      signal.removeEventListener('abort', onAbort);
      reject(signal.reason ?? new Error('Free Spins transition aborted'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) onAbort();
  });
}

export class FreeSpinsThemeController {
  private readonly scene: MainSceneController;

  constructor(scene: MainSceneController) {
    this.scene = scene;
  }

  async enter(signal: AbortSignal): Promise<void> {
    await this.play('freeSpins', signal);
  }

  async leave(signal: AbortSignal): Promise<void> {
    await this.play('base', signal);
  }

  private async play(theme: SceneTheme, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    this.scene.showFreeSpinsTransition(theme === 'freeSpins' ? 'activated' : 'complete');
    try {
      await this.scene.fadeFreeSpinsTransition(1, FADE_SECONDS, signal);
      signal.throwIfAborted();
      this.scene.setTheme(theme);
      await hold(signal);
      await this.scene.fadeFreeSpinsTransition(0, FADE_SECONDS, signal);
    } finally {
      this.scene.hideFreeSpinsTransition();
    }
  }
}
