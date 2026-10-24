// @vitest-environment node
import type { RoundResult } from '@lucky-games/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MainSceneController } from '../main-scene-controller/MainSceneController';
import { WinPopupController } from './WinPopupController';

const round = {
  winType: 'MEGA_WIN',
  totalWinCoins: 750,
  features: { freeSpins: {} },
} as RoundResult;

function createController() {
  const scene = {
    showWinPopup: vi.fn(),
    hideWinPopup: vi.fn(),
  } as unknown as MainSceneController;
  return { scene, controller: new WinPopupController(scene) };
}

afterEach(() => vi.useRealTimers());

describe('WinPopupController', () => {
  it('shows a server-classified win and closes before resolving', async () => {
    vi.useFakeTimers();
    const { scene, controller } = createController();
    const completion = controller.present(round, new AbortController().signal);

    expect(scene.showWinPopup).toHaveBeenCalledWith('MEGA_WIN', 750);
    await vi.runAllTimersAsync();
    await completion;
    expect(scene.hideWinPopup).toHaveBeenCalledOnce();
  });

  it('uses the total bonus classification on the last free spin', async () => {
    vi.useFakeTimers();
    const { scene, controller } = createController();
    const bonusRound = {
      ...round,
      features: {
        freeSpins: {
          completion: {
            baseBetCoins: 15,
            totalWinCoins: 3000,
            winMultiplier: 200,
            winType: 'SUPER_MEGA_WIN',
          },
        },
      },
    } as RoundResult;

    const completion = controller.present(bonusRound, new AbortController().signal);
    expect(scene.showWinPopup).toHaveBeenCalledWith('SUPER_MEGA_WIN', 3000);
    expect(scene.showWinPopup).toHaveBeenCalledTimes(1);
    await vi.runAllTimersAsync();
    await completion;
  });

  it('does not show a popup for a normal win', async () => {
    const { scene, controller } = createController();
    await controller.present({ ...round, winType: 'NORMAL_WIN' }, new AbortController().signal);
    expect(scene.showWinPopup).not.toHaveBeenCalled();
  });

  it('hides the popup when the presentation is skipped', async () => {
    const { scene, controller } = createController();
    const abort = new AbortController();
    const completion = controller.present(round, abort.signal);
    abort.abort(new Error('Skipped'));

    await expect(completion).rejects.toThrow('Skipped');
    expect(scene.hideWinPopup).toHaveBeenCalledOnce();
  });
});
