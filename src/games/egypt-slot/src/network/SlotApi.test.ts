// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RoundResult, SlotCommand, SlotState } from '@lucky-games/contracts';
import { SlotApi } from './SlotApi';
import { SlotApiError } from './SlotApiError';

const network = vi.hoisted(() => ({
  createSession: vi.fn(),
  getState: vi.fn(),
  getRound: vi.fn(),
  send: vi.fn(),
  destroy: vi.fn(),
}));

vi.mock('./SlotHttpClient', () => ({
  SlotHttpClient: class {
    createSession = network.createSession;
    getState = network.getState;
    getRound = network.getRound;
  },
}));

vi.mock('./SlotSocketClient', () => ({
  SlotSocketClient: class {
    send = network.send;
    destroy = network.destroy;
  },
}));

const state: SlotState = {
  sessionId: 'c3ec6ee3-44bd-447b-95e6-f467426bf83a',
  balanceCoins: 250_000,
  freeSpins: { remaining: 0, totalWinCoins: 0, stickyReels: [] },
  lastBet: null,
  nextAction: 'SPIN',
  config: {
    bets: [15, 20],
    levels: [1, 10],
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

describe('SlotApi round recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const items = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => items.set(key, value),
      removeItem: (key: string) => items.delete(key),
      clear: () => items.clear(),
    });
    network.createSession.mockResolvedValue(state);
    network.getState.mockResolvedValue(state);
  });

  it('blocks a new bet and retries the unresolved command with its original request ID', async () => {
    const api = new SlotApi('http://localhost:3001');
    await api.initialize();
    network.send.mockRejectedValueOnce(new SlotApiError('WebSocket connection closed'));
    network.getRound.mockRejectedValueOnce(new SlotApiError('Round not found', 'ROUND_NOT_FOUND'));

    await expect(api.spin({ bet: 15, level: 1 })).rejects.toThrow();
    const original = network.send.mock.calls[0][0] as SlotCommand;
    expect(api.hasPendingRound).toBe(true);
    await expect(api.spin({ bet: 20, level: 10 })).rejects.toThrow(
      'The previous round must be recovered first',
    );
    expect(network.send).toHaveBeenCalledTimes(1);

    const result = { requestId: original.requestId, roundId: 'recovered' } as RoundResult;
    network.getRound.mockRejectedValueOnce(new SlotApiError('Round not found', 'ROUND_NOT_FOUND'));
    network.send.mockResolvedValueOnce(result);
    await expect(api.recoverPendingRound()).resolves.toBe(result);
    expect(network.send.mock.calls[1][0]).toEqual(original);
    expect(api.hasPendingRound).toBe(false);
    api.destroy();
  });

  it('restores a pending request after reload before allowing another spin', async () => {
    const command: SlotCommand = {
      type: 'SPIN',
      sessionId: state.sessionId,
      requestId: 'saved_request',
      bet: 15,
      level: 1,
    };
    const result = { requestId: command.requestId, roundId: 'saved_round' } as RoundResult;
    sessionStorage.setItem('egypt-slot:session-id', state.sessionId);
    sessionStorage.setItem('egypt-slot:pending-command', JSON.stringify(command));
    network.getRound
      .mockRejectedValueOnce(new SlotApiError('Round not found', 'ROUND_NOT_FOUND'))
      .mockResolvedValueOnce(result);

    const api = new SlotApi('http://localhost:3001');
    const initial = await api.initialize();
    expect(initial.recoveredRound).toBeNull();
    expect(api.pendingAction).toBe('SPIN');
    await expect(api.spin({ bet: 20, level: 10 })).rejects.toThrow();
    await expect(api.recoverPendingRound()).resolves.toBe(result);
    expect(network.getRound).toHaveBeenLastCalledWith(
      state.sessionId,
      command.requestId,
      undefined,
    );
    expect(network.send).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('egypt-slot:pending-command')).toBeNull();
    api.destroy();
  });
});
