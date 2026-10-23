import { afterEach, describe, expect, it } from 'vitest';
import type { SlotState } from '@lucky-games/contracts';
import { createServer } from '../src/http/createServer.js';
import type { SlotService } from '../src/game/SlotService.js';

const state: SlotState = {
  sessionId: 'd633897d-8727-4906-8af6-32ebf5ffb19b',
  balanceCoins: 250000,
  freeSpins: { remaining: 0, totalWinCoins: 0, stickyReels: [] },
  lastBet: null,
  nextAction: 'SPIN',
  config: {
    bets: [15],
    levels: [1],
    coinValuesCents: [2],
    paylines: [[0, 0, 0, 0, 0]],
  },
};

const service = {
  createSession: async () => state,
  getState: async () => state,
  getRound: async () => ({ roundId: 'recorded' }),
  play: async (command: { requestId: string }) => ({
    requestId: command.requestId,
    roundId: 'recorded',
  }),
} as unknown as SlotService;

describe('HTTP and WebSocket protocol', () => {
  const servers: Awaited<ReturnType<typeof createServer>>[] = [];
  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()));
  });

  it('creates a session and reads its state by bearer ID', async () => {
    const server = await createServer(service, ['http://localhost:5173']);
    servers.push(server);
    const created = await server.inject({ method: 'POST', url: '/api/slot/session' });
    const loaded = await server.inject({
      method: 'GET',
      url: '/api/slot/state',
      headers: { authorization: `Bearer ${state.sessionId}` },
    });
    expect(created.statusCode).toBe(200);
    expect(created.json()).toEqual(state);
    expect(loaded.json()).toEqual(state);
  });

  it('rejects state access without a session', async () => {
    const server = await createServer(service, []);
    servers.push(server);
    const response = await server.inject({ method: 'GET', url: '/api/slot/state' });
    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe('UNAUTHORIZED');
  });

  it('returns a complete message envelope for a valid WebSocket command', async () => {
    const server = await createServer(service, ['http://localhost:5173']);
    servers.push(server);
    await server.ready();
    const socket = await server.injectWS('/api/slot/ws', {
      headers: { origin: 'http://localhost:5173' },
    });
    try {
      const response = new Promise<string>((resolve) =>
        socket.once('message', (data: { toString(): string }) => resolve(data.toString())),
      );
      socket.send(
        JSON.stringify({
          type: 'SPIN',
          sessionId: state.sessionId,
          requestId: 'req_1',
          bet: 15,
          level: 1,
          coinValueCents: 2,
        }),
      );
      expect(JSON.parse(await response)).toEqual({
        type: 'ROUND_RESULT',
        requestId: 'req_1',
        result: { requestId: 'req_1', roundId: 'recorded' },
      });
    } finally {
      socket.terminate();
    }
  });
});
