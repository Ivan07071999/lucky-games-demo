// @vitest-environment node
import type { ReelGrid, RoundResult } from '@lucky-games/contracts';
import { describe, expect, it, vi } from 'vitest';
import { BalanceController } from '../controllers/balance-controller/BalanceController';
import type { ReelsController } from '../controllers/reels-controller/ReelsController';
import { GameEmitter } from '../events/GameEmitter';
import type { GameEvents } from '../events/GameEvents';
import { INITIAL_REELS } from '../reels/reelsConfig';
import { SlotStore } from '../stores/SlotStore';
import { ResultPhase } from './result';

const result = {
  requestId: 'spin-request-1',
  roundId: 'round-1',
  status: 'completed',
  mode: 'BASE_GAME',
  isWin: true,
  netCoins: 45,
  bet: { bet: 15, level: 1, totalCoins: 15 },
  balance: { before: 250000, afterBet: 249985, afterWin: 250045 },
  reels: INITIAL_REELS as unknown as ReelGrid,
  wins: [],
  totalWinCoins: 60,
  nextAction: 'SPIN',
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
  animations: [],
} satisfies RoundResult;

describe('ResultPhase', () => {
  it('enters the Free Spins intro after a bonus is awarded', async () => {
    const store = new SlotStore();
    const emitter = new GameEmitter<GameEvents>();
    const reels = {
      presentResult: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReelsController;
    const balance = new BalanceController(store.panel);
    const phase = new ResultPhase(store, emitter, reels, balance);
    const bonusResult: RoundResult = {
      ...result,
      isWin: false,
      netCoins: -15,
      totalWinCoins: 0,
      balance: { before: 250000, afterBet: 249985, afterWin: 249985 },
      nextAction: 'FREE_SPIN',
      features: {
        ...result.features,
        freeSpins: { triggered: true, awarded: 8, remaining: 8, totalWinCoins: 0 },
      },
    };
    store.round.startRound();
    store.round.receiveRound(bonusResult);

    await expect(phase.enter(new AbortController().signal)).resolves.toBe('freeSpinsIntro');
    expect(store.round.isFreeSpin).toBe(true);
  });

  it('skips a long win presentation and settles the server balance', async () => {
    const store = new SlotStore();
    const emitter = new GameEmitter<GameEvents>();
    const presentResult = vi.fn(
      (_result: RoundResult, signal: AbortSignal) =>
        new Promise<void>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('Presentation skipped')), {
            once: true,
          });
        }),
    );
    const reels = { presentResult } as unknown as ReelsController;
    const balance = new BalanceController(store.panel);
    const phase = new ResultPhase(store, emitter, reels, balance);
    store.round.startRound();
    store.round.receiveRound(result);

    const completion = phase.enter(new AbortController().signal);
    expect(store.round.stage).toBe('showingWin');
    emitter.emit('ui:skipWinRequested');

    await expect(completion).resolves.toBe('idle');
    expect(store.panel.balanceCoins).toBe(result.balance.afterWin);
    expect(store.round.stage).toBe('idle');
    expect(presentResult).toHaveBeenCalledOnce();
  });

  it('waits for the balance animation before completing a big win', async () => {
    const store = new SlotStore();
    const emitter = new GameEmitter<GameEvents>();
    const reels = {
      presentResult: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReelsController;
    let finishBalance: () => void = () => {};
    const showWin = vi.fn(() => new Promise<void>((resolve) => (finishBalance = resolve)));
    const balance = { showWin, settle: vi.fn() } as unknown as BalanceController;
    const phase = new ResultPhase(store, emitter, reels, balance);
    const onCompleted = vi.fn();
    emitter.on('round:completed', onCompleted);
    store.round.startRound();
    store.round.receiveRound({ ...result, winType: 'BIG_WIN', winMultiplier: 20 });

    const completion = phase.enter(new AbortController().signal);
    await vi.waitFor(() => expect(showWin).toHaveBeenCalledOnce());
    expect(onCompleted).not.toHaveBeenCalled();
    expect(store.round.stage).toBe('showingWin');

    finishBalance();
    await expect(completion).resolves.toBe('idle');
    expect(balance.settle).toHaveBeenCalledOnce();
    expect(onCompleted).toHaveBeenCalledOnce();
  });

  it('skips the balance animation and still settles the round', async () => {
    const store = new SlotStore();
    const emitter = new GameEmitter<GameEvents>();
    const reels = {
      presentResult: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReelsController;
    const showWin = vi.fn(
      (_result: RoundResult, signal: AbortSignal) =>
        new Promise<void>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('Balance animation skipped')), {
            once: true,
          });
        }),
    );
    const balance = { showWin, settle: vi.fn() } as unknown as BalanceController;
    const phase = new ResultPhase(store, emitter, reels, balance);
    store.round.startRound();
    store.round.receiveRound({ ...result, winType: 'BIG_WIN', winMultiplier: 20 });

    const completion = phase.enter(new AbortController().signal);
    await vi.waitFor(() => expect(showWin).toHaveBeenCalledOnce());
    emitter.emit('ui:skipWinRequested');

    await expect(completion).resolves.toBe('idle');
    expect(balance.settle).toHaveBeenCalledOnce();
    expect(store.round.stage).toBe('idle');
  });
});
