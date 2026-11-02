// @vitest-environment node
import type { ReelGrid, RoundResult, SlotState } from '@lucky-games/contracts';
import { describe, expect, it, vi } from 'vitest';
import { BalanceController } from '../controllers/balance-controller/BalanceController';
import type { MainSceneController } from '../controllers/main-scene-controller/MainSceneController';
import { ReelsController } from '../controllers/reels-controller/ReelsController';
import { GameEmitter } from '../events/GameEmitter';
import type { GameEvents } from '../events/GameEvents';
import type { SlotApi } from '../network/SlotApi';
import { INITIAL_REELS } from '../reels/reelsConfig';
import type { ReelsMachine } from '../reelsMachine/ReelsMachine';
import type { ReelsCommand } from '../reelsMachine/commands';
import { SlotStore } from '../stores/SlotStore';
import { FreeSpinsPhase } from './free-spins';

const state: SlotState = {
  sessionId: 'session-1',
  balanceCoins: 100,
  freeSpins: { remaining: 1, totalWinCoins: 0, stickyReels: [] },
  lastBet: { bet: 15, level: 1, totalCoins: 15 },
  nextAction: 'FREE_SPIN',
  config: {
    bets: [15],
    levels: [1],
    paylines: [],
    payouts: {
      defaultA: [1, 3, 5],
      defaultJ: [1, 3, 5],
      defaultK: [1, 3, 5],
      defaultQ: [1, 3, 5],
      highAnkh: [4, 8, 12],
      highEye: [3, 7, 11],
      highNecklace: [3, 6, 10],
      highScarab: [0, 0, 0],
      wild: [0, 0, 0],
    },
    wildMultiplier: 3,
    scatterSymbol: 'highScarab',
    scatterTriggerCount: 3,
    freeSpinsAwarded: 8,
  },
};

const result: RoundResult = {
  requestId: 'free-spin-1',
  roundId: 'round-1',
  status: 'completed',
  mode: 'FREE_SPINS',
  isWin: false,
  netCoins: 0,
  bet: state.lastBet!,
  balance: { before: 100, afterBet: 100, afterWin: 100 },
  reels: INITIAL_REELS.map((reel) => [...reel]) as ReelGrid,
  wins: [],
  totalWinCoins: 0,
  features: {
    wild: {
      triggered: false,
      type: 'EXPANDING',
      expandedReels: [],
      stickyReels: [],
      multipliers: {},
    },
    freeSpins: { triggered: false, awarded: 0, remaining: 0, totalWinCoins: 0 },
  },
  animations: ['REELS_STOP'],
  nextAction: 'SPIN',
};

describe('FreeSpinsPhase', () => {
  it('runs one server free spin without debiting the balance', async () => {
    const store = new SlotStore();
    store.applyInitialState(state);
    const emitter = new GameEmitter<GameEvents>();
    const machine = {
      spin: vi.fn(),
      land: vi.fn().mockResolvedValue(undefined),
      setSymbols: vi.fn(),
    };
    const scene = {
      clearError: vi.fn(),
      showError: vi.fn(),
      executeReels: (command: ReelsCommand, signal: AbortSignal) =>
        command.execute(machine as unknown as ReelsMachine, signal),
    } as unknown as MainSceneController;
    const reels = new ReelsController(scene, emitter, store.round);
    let resolveRequest: (value: RoundResult) => void = () => undefined;
    const freeSpin = vi.fn(() => new Promise<RoundResult>((resolve) => (resolveRequest = resolve)));
    const spin = vi.fn();
    const api = { freeSpin, spin } as unknown as SlotApi;
    const phase = new FreeSpinsPhase(
      api,
      store,
      scene,
      reels,
      new BalanceController(store.balance),
    );

    const completion = phase.enter(new AbortController().signal);
    expect(machine.spin).toHaveBeenCalledOnce();
    expect(freeSpin).toHaveBeenCalledOnce();
    expect(spin).not.toHaveBeenCalled();
    expect(store.balance.balanceCoins).toBe(100);
    expect(store.balance.displayBalanceCoins).toBe(100);

    resolveRequest(result);
    await expect(completion).resolves.toBe('result');
    expect(machine.land).toHaveBeenCalledWith(result.reels, expect.any(AbortSignal));
    expect(store.round.currentRound).toBe(result);
    reels.destroy();
  });
});
