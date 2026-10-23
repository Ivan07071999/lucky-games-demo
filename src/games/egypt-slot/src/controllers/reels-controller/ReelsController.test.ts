// @vitest-environment node
import type { RoundResult } from '@lucky-games/contracts';
import { describe, expect, it, vi } from 'vitest';
import { GameEmitter } from '../../events/GameEmitter';
import type { GameEvents } from '../../events/GameEvents';
import { INITIAL_REELS } from '../../reels/reelsConfig';
import type { ReelsMachine } from '../../reelsMachine/ReelsMachine';
import type { ReelsCommand } from '../../reelsMachine/commands';
import { ReelsStore } from '../../stores/ReelsStore';
import { RoundStore } from '../../stores/RoundStore';
import type { MainSceneController } from '../main-scene-controller/MainSceneController';
import { ReelsController } from './ReelsController';

const result = { reels: INITIAL_REELS } as RoundResult;

function createController(machine: Pick<ReelsMachine, 'spin' | 'land' | 'setSymbols'>) {
  const emitter = new GameEmitter<GameEvents>();
  const round = new RoundStore();
  const store = new ReelsStore();
  const scene = {
    executeReels: (command: ReelsCommand, signal: AbortSignal) =>
      command.execute(machine as ReelsMachine, signal),
  } as MainSceneController;
  const controller = new ReelsController(scene, emitter, store, round);
  round.startRound();
  return { controller, emitter, round, store };
}

describe('ReelsController Quick Stop', () => {
  it('waits for the server result before setting final symbols', async () => {
    const machine = { spin: vi.fn(), land: vi.fn(), setSymbols: vi.fn() };
    const { controller, emitter, round, store } = createController(machine);
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
    expect(machine.spin).toHaveBeenCalledOnce();

    resolveRequest(result);
    await expect(playing).resolves.toBe(result);
    expect(request).toHaveBeenCalledOnce();
    expect(machine.land).not.toHaveBeenCalled();
    expect(machine.setSymbols).toHaveBeenCalledWith(result.reels);
    expect(store.isSpinning).toBe(false);
    controller.destroy();
  });

  it('interrupts landing and keeps the server result', async () => {
    let rejectLanding: (reason: Error) => void = () => undefined;
    const machine = {
      spin: vi.fn(),
      land: vi.fn(() => new Promise<void>((_resolve, reject) => (rejectLanding = reject))),
      setSymbols: vi.fn(() => rejectLanding(new Error('Landing interrupted'))),
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
    expect(machine.setSymbols).toHaveBeenCalledWith(result.reels);
    controller.destroy();
  });

  it('does not allow Quick Stop during free spins', () => {
    const round = new RoundStore();
    round.nextAction = 'FREE_SPIN';
    round.freeSpins = { remaining: 1, totalWinCoins: 0, stickyReels: [] };
    round.startRound();

    expect(round.requestQuickStop()).toBe(false);
  });
});
