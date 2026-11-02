// @vitest-environment node
import type { RoundResult } from '@lucky-games/contracts';
import { describe, expect, it, vi } from 'vitest';
import { GameEmitter } from '../../events/GameEmitter';
import type { GameEvents } from '../../events/GameEvents';
import { INITIAL_REELS } from '../../reels/reelsConfig';
import type { ReelsMachine } from '../../reelsMachine/ReelsMachine';
import type { ReelsCommand } from '../../reelsMachine/commands';
import { RoundStore } from '../../stores/RoundStore';
import { SessionStore } from '../../stores/SessionStore';
import type { MainSceneController } from '../main-scene-controller/MainSceneController';
import { ReelsController } from './ReelsController';

const result = { reels: INITIAL_REELS } as RoundResult;

function createController(
  machine: Pick<ReelsMachine, 'spin' | 'land' | 'setSymbols' | 'requestQuickStop'>,
) {
  const emitter = new GameEmitter<GameEvents>();
  const round = new RoundStore(new SessionStore());
  const scene = {
    executeReels: (command: ReelsCommand, signal: AbortSignal) =>
      command.execute(machine as ReelsMachine, signal),
  } as MainSceneController;
  const controller = new ReelsController(scene, emitter, round);
  round.startRound();
  return { controller, emitter, round };
}

describe('ReelsController Quick Stop', () => {
  it('waits for the server result before landing all reels together', async () => {
    const machine = {
      spin: vi.fn(),
      land: vi.fn(),
      setSymbols: vi.fn(),
      requestQuickStop: vi.fn(),
    };
    const { controller, emitter, round } = createController(machine);
    let resolveRequest: (value: RoundResult) => void = () => undefined;
    const request = vi.fn(() => new Promise<RoundResult>((resolve) => (resolveRequest = resolve)));

    const playing = controller.playRound(
      request,
      INITIAL_REELS,
      vi.fn(),
      new AbortController().signal,
    );
    emitter.emit('ui:quickStopRequested');

    expect(round.quickStopRequested).toBe(true);
    expect(machine.setSymbols).not.toHaveBeenCalled();
    expect(machine.land).not.toHaveBeenCalled();
    expect(machine.spin).toHaveBeenCalledOnce();

    resolveRequest(result);
    await expect(playing).resolves.toBe(result);
    expect(request).toHaveBeenCalledOnce();
    expect(machine.land).toHaveBeenCalledWith(result.reels, expect.any(AbortSignal), true);
    expect(machine.setSymbols).not.toHaveBeenCalled();
    controller.destroy();
  });

  it('starts a common landing when the server result is already available', async () => {
    let resolveLanding: () => void = () => undefined;
    const machine = {
      spin: vi.fn(),
      land: vi.fn(() => new Promise<void>((resolve) => (resolveLanding = resolve))),
      setSymbols: vi.fn(),
      requestQuickStop: vi.fn(() => resolveLanding()),
    };
    const { controller, emitter, round } = createController(machine);
    const request = vi.fn().mockResolvedValue(result);

    const playing = controller.playRound(
      request,
      INITIAL_REELS,
      vi.fn(),
      new AbortController().signal,
    );
    await vi.waitFor(() => expect(machine.land).toHaveBeenCalledOnce());
    expect(round.stage).toBe('landing');

    emitter.emit('ui:quickStopRequested');

    await expect(playing).resolves.toBe(result);
    expect(request).toHaveBeenCalledOnce();
    expect(machine.requestQuickStop).toHaveBeenCalledWith(result.reels, expect.any(AbortSignal));
    expect(machine.setSymbols).not.toHaveBeenCalled();
    controller.destroy();
  });

  it('does not allow Quick Stop during free spins', () => {
    const session = new SessionStore();
    const round = new RoundStore(session);
    session.nextAction = 'FREE_SPIN';
    session.freeSpins = { remaining: 1, totalWinCoins: 0, stickyReels: [] };
    round.startRound();

    expect(round.requestQuickStop()).toBe(false);
  });
});
