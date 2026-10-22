import { describe, expect, it } from 'vitest';
import type { RoundResult } from '@lucky-games/contracts';
import { SlotService } from '../src/game/SlotService.js';
import { Database, SlotError, type SessionRow } from '../src/storage/Database.js';

function createService(balanceCoins = 250000, freeSpinsRemaining = 0) {
  const session: SessionRow = {
    id: 'd633897d-8727-4906-8af6-32ebf5ffb19b',
    balance_coins: balanceCoins,
    free_spins_remaining: freeSpinsRemaining,
    free_spins_total_win: 0,
    sticky_reels: [],
    last_bet: { bet: 15, level: 1, coinValue: 0.02, totalCoins: 15 },
  };
  const rounds = new Map<string, RoundResult>();
  const database = {
    executeRound: async (
      _sessionId: string,
      requestId: string,
      _action: string,
      calculate: (state: SessionRow) => RoundResult,
    ) => {
      const existing = rounds.get(requestId);
      if (existing) return existing;
      const result = calculate(session);
      session.balance_coins = result.balance.afterWin;
      session.free_spins_remaining = result.features.freeSpins.remaining;
      session.free_spins_total_win = result.features.freeSpins.totalWinCoins;
      session.sticky_reels = result.features.wild.stickyReels;
      session.last_bet = result.bet;
      rounds.set(requestId, result);
      return result;
    },
  } as unknown as Database;
  // Постоянный defaultA даёт предсказуемый выигрыш на всех пяти линиях.
  return { service: new SlotService(database, () => 2), session };
}

describe('SlotService', () => {
  it('saves the final balance and returns the same round for a repeated request', async () => {
    const { service, session } = createService();
    const command = {
      type: 'SPIN' as const,
      sessionId: session.id,
      requestId: 'req_1',
      bet: 15,
      level: 1,
      coinValue: 0.02,
    };
    const first = await service.play(command);
    const second = await service.play(command);
    expect(second).toEqual(first);
    expect(first.balance.before).toBe(250000);
    expect(first.balance.afterBet).toBe(249985);
    expect(session.balance_coins).toBe(first.balance.afterWin);
  });

  it('does not charge a player with insufficient coins', async () => {
    const { service, session } = createService(14);
    await expect(
      service.play({
        type: 'SPIN',
        sessionId: session.id,
        requestId: 'req_2',
        bet: 15,
        level: 1,
        coinValue: 0.02,
      }),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_BALANCE' } satisfies Partial<SlotError>);
    expect(session.balance_coins).toBe(14);
  });

  it('executes a free spin without debiting its saved bet', async () => {
    const { service, session } = createService(100, 1);
    const result = await service.play({
      type: 'FREE_SPIN',
      sessionId: session.id,
      requestId: 'free_1',
    });
    expect(result.balance.before).toBe(100);
    expect(result.balance.afterBet).toBe(100);
    expect(result.nextAction).toBe('SPIN');
    expect(session.free_spins_remaining).toBe(0);
  });
});
