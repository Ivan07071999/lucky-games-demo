import { randomInt, randomUUID } from 'node:crypto';
import type { Bet, RoundResult, SlotCommand, SlotState } from '@lucky-games/contracts';
import { Database, SlotError, type SessionRow } from '../storage/Database.js';
import {
  BETS,
  COIN_VALUES_CENTS,
  evaluateRound,
  FREE_SPINS_AWARDED,
  generateReels,
  LEVELS,
  PAYLINES,
  validateBet,
} from './rules.js';

export class SlotService {
  constructor(
    private readonly database: Database,
    private readonly random: (maxExclusive: number) => number = randomInt,
  ) {}

  async createSession(): Promise<SlotState> {
    return this.toState(await this.database.createSession());
  }

  async getState(sessionId: string): Promise<SlotState> {
    const session = await this.database.getSession(sessionId);
    if (!session) throw new SlotError('SESSION_NOT_FOUND', 'Session was not found');
    return this.toState(session);
  }

  async getRound(sessionId: string, requestId: string): Promise<RoundResult> {
    const result = await this.database.getRound(sessionId, requestId);
    if (!result) throw new SlotError('ROUND_NOT_FOUND', 'Round was not found');
    return result;
  }

  async play(command: SlotCommand): Promise<RoundResult> {
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(command.requestId)) {
      throw new SlotError('INVALID_REQUEST', 'Invalid requestId');
    }
    const bet =
      command.type === 'SPIN'
        ? validateBet(command.bet, command.level, command.coinValueCents)
        : null;
    if (command.type === 'SPIN' && !bet) {
      throw new SlotError('INVALID_BET', 'Bet, level or coin value is not allowed');
    }
    return this.database.executeRound(
      command.sessionId,
      command.requestId,
      command.type,
      (session) => this.calculate(session, command, bet),
    );
  }

  private calculate(
    session: SessionRow,
    command: SlotCommand,
    selectedBet: Bet | null,
  ): RoundResult {
    const isFreeSpin = command.type === 'FREE_SPIN';
    if (isFreeSpin && session.free_spins_remaining === 0) {
      throw new SlotError('NO_FREE_SPINS', 'No free spins remain');
    }
    if (!isFreeSpin && session.free_spins_remaining > 0) {
      throw new SlotError('FREE_SPINS_PENDING', 'Complete free spins before another paid spin');
    }
    const bet = isFreeSpin ? session.last_bet : selectedBet;
    if (!bet) throw new SlotError('INVALID_BET', 'Bet is missing');
    const cost = isFreeSpin ? 0 : bet.totalCoins;
    if (session.balance_coins < cost) {
      throw new SlotError('INSUFFICIENT_BALANCE', 'Insufficient balance');
    }

    const outcome = evaluateRound(
      generateReels(this.random),
      bet,
      isFreeSpin ? 'FREE_SPINS' : 'BASE_GAME',
      session.sticky_reels,
    );
    const remaining = isFreeSpin
      ? session.free_spins_remaining - 1
      : outcome.features.freeSpins.triggered
        ? FREE_SPINS_AWARDED
        : 0;
    const totalBonusWin = isFreeSpin ? session.free_spins_total_win + outcome.totalWinCoins : 0;
    const finalBalance = session.balance_coins - cost + outcome.totalWinCoins;
    if (!Number.isSafeInteger(finalBalance))
      throw new SlotError('BALANCE_OVERFLOW', 'Balance is too large');
    outcome.features.freeSpins.remaining = remaining;
    outcome.features.freeSpins.totalWinCoins = totalBonusWin;
    if (remaining === 0) outcome.features.wild.stickyReels = [];

    return {
      requestId: command.requestId,
      roundId: randomUUID(),
      status: 'completed',
      mode: isFreeSpin ? 'FREE_SPINS' : 'BASE_GAME',
      isWin: outcome.totalWinCoins > 0,
      netCoins: outcome.totalWinCoins - cost,
      bet,
      balance: {
        before: session.balance_coins,
        afterBet: session.balance_coins - cost,
        afterWin: finalBalance,
      },
      ...outcome,
      nextAction: remaining ? 'FREE_SPIN' : 'SPIN',
    };
  }

  private toState(session: SessionRow): SlotState {
    return {
      sessionId: session.id,
      balanceCoins: session.balance_coins,
      freeSpins: {
        remaining: session.free_spins_remaining,
        totalWinCoins: session.free_spins_total_win,
        stickyReels: session.sticky_reels,
      },
      lastBet: session.last_bet,
      nextAction: session.free_spins_remaining ? 'FREE_SPIN' : 'SPIN',
      config: {
        bets: BETS,
        levels: LEVELS,
        coinValuesCents: COIN_VALUES_CENTS,
        paylines: PAYLINES.map((line) => [...line]),
      },
    };
  }
}
