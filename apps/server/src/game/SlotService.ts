import { randomInt, randomUUID } from 'node:crypto';
import {
  SYMBOLS,
  type Bet,
  type RoundResult,
  type SlotCommand,
  type SlotState,
} from '@lucky-games/contracts';
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
import { classifyWin } from './winClassification.js';
import { SLOT_MATH } from './mathConfig.js';
import { getReelAnticipationHint } from './presentationHints.js';
import { generateAnticipationDemoReels } from './anticipationDemo.js';
import { calculateCascadeRound } from './cascadeRules.js';

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
    if (command.type === 'SPIN' && command.cascade && command.anticipationDemo) {
      throw new SlotError('INVALID_REQUEST', 'Cascade and anticipation demo cannot be combined');
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

    const mode = isFreeSpin ? 'FREE_SPINS' : 'BASE_GAME';
    const outcome =
      command.type === 'SPIN' && command.cascade
        ? calculateCascadeRound(this.random, bet)
        : evaluateRound(
            command.type === 'SPIN' && command.anticipationDemo
              ? generateAnticipationDemoReels(this.random)
              : generateReels(this.random, mode),
            bet,
            mode,
            session.sticky_reels,
          );
    const remaining = isFreeSpin
      ? session.free_spins_remaining - 1
      : outcome.features.freeSpins.triggered
        ? FREE_SPINS_AWARDED
        : 0;
    const totalBonusWin = isFreeSpin ? session.free_spins_total_win + outcome.totalWinCoins : 0;
    if (!Number.isSafeInteger(totalBonusWin)) {
      throw new SlotError('BALANCE_OVERFLOW', 'Bonus win is too large');
    }
    const finalBalance = session.balance_coins - cost + outcome.totalWinCoins;
    if (!Number.isSafeInteger(finalBalance))
      throw new SlotError('BALANCE_OVERFLOW', 'Balance is too large');
    outcome.features.freeSpins.remaining = remaining;
    outcome.features.freeSpins.totalWinCoins = totalBonusWin;
    if (isFreeSpin && remaining === 0) {
      outcome.features.freeSpins.completion = {
        baseBetCoins: bet.totalCoins,
        totalWinCoins: totalBonusWin,
        ...classifyWin(totalBonusWin, bet.totalCoins),
      };
    }
    if (remaining === 0) outcome.features.wild.stickyReels = [];

    return {
      requestId: command.requestId,
      roundId: randomUUID(),
      status: 'completed',
      mode: isFreeSpin ? 'FREE_SPINS' : 'BASE_GAME',
      isWin: outcome.totalWinCoins > 0,
      netCoins: outcome.totalWinCoins - cost,
      ...classifyWin(outcome.totalWinCoins, bet.totalCoins),
      bet,
      balance: {
        before: session.balance_coins,
        afterBet: session.balance_coins - cost,
        afterWin: finalBalance,
      },
      ...outcome,
      presentation: {
        anticipation:
          command.type === 'SPIN' && command.cascade
            ? null
            : getReelAnticipationHint(
                outcome.reels,
                mode,
                SLOT_MATH.scatterSymbol,
                SLOT_MATH.scatterTriggerCount,
              ),
      },
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
        bets: [...BETS],
        levels: [...LEVELS],
        coinValuesCents: [...COIN_VALUES_CENTS],
        paylines: PAYLINES.map((line) => [...line]),
        payouts: Object.fromEntries(
          SYMBOLS.map((symbol) => [symbol, [...SLOT_MATH.payouts[symbol]]]),
        ) as SlotState['config']['payouts'],
        wildMultiplier: SLOT_MATH.wildMultiplier,
        scatterSymbol: SLOT_MATH.scatterSymbol,
        scatterTriggerCount: SLOT_MATH.scatterTriggerCount,
        freeSpinsAwarded: SLOT_MATH.freeSpinsAwarded,
      },
    };
  }
}
