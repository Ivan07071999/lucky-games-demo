import { randomInt, randomUUID } from 'node:crypto';
import {
  DEFAULT_PAYLINE_COUNT,
  PAYLINE_COUNTS,
  SYMBOLS,
  WIN_DEMO_TYPES,
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
import { generateWinningDemoReels } from './winDemo.js';
import { generateWinTypeDemoReels, winTypeDemoRefillSymbol } from './winTypeDemo.js';

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
    const validatedBet =
      command.type === 'SPIN'
        ? validateBet(command.bet, command.level, command.coinValueCents)
        : null;
    if (command.type === 'SPIN' && !validatedBet) {
      throw new SlotError('INVALID_BET', 'Bet, level or coin value is not allowed');
    }
    if (command.type === 'SPIN') {
      if (command.paylineCount !== undefined && !PAYLINE_COUNTS.includes(command.paylineCount)) {
        throw new SlotError('INVALID_REQUEST', 'Payline count is not allowed');
      }
      const spinMode = command.spinMode ?? (command.cascade ? 'CASCADE' : 'CLASSIC');
      if (command.cascade && spinMode !== 'CASCADE') {
        throw new SlotError('INVALID_REQUEST', 'Conflicting spin modes');
      }
      if (command.anticipationDemo && spinMode === 'CASCADE') {
        throw new SlotError('INVALID_REQUEST', 'Cascade and anticipation demo cannot be combined');
      }
      if (command.winDemo) {
        if (command.anticipationDemo || command.winTypeDemo) {
          throw new SlotError(
            'INVALID_REQUEST',
            'Win combination demo cannot be combined with another demo',
          );
        }
        if (!SLOT_MATH.payouts[command.winDemo.symbol][command.winDemo.count - 3]) {
          throw new SlotError('INVALID_REQUEST', 'Selected win combination is not paid');
        }
      }
      if (command.winTypeDemo) {
        if (!WIN_DEMO_TYPES.includes(command.winTypeDemo)) {
          throw new SlotError('INVALID_REQUEST', 'Win type demo is not allowed');
        }
        if (command.anticipationDemo) {
          throw new SlotError(
            'INVALID_REQUEST',
            'Win type and anticipation demos cannot be combined',
          );
        }
      }
    }
    const bet =
      command.type === 'SPIN' && validatedBet
        ? { ...validatedBet, paylineCount: command.paylineCount ?? DEFAULT_PAYLINE_COUNT }
        : null;
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
    const paylineCount = bet.paylineCount ?? DEFAULT_PAYLINE_COUNT;
    const cost = isFreeSpin ? 0 : bet.totalCoins;
    if (session.balance_coins < cost) {
      throw new SlotError('INSUFFICIENT_BALANCE', 'Insufficient balance');
    }

    const mode = isFreeSpin ? 'FREE_SPINS' : 'BASE_GAME';
    const spinMode =
      command.type === 'SPIN'
        ? (command.spinMode ?? (command.cascade ? 'CASCADE' : 'CLASSIC'))
        : 'CLASSIC';
    const demoReels =
      command.type !== 'SPIN'
        ? undefined
        : command.winTypeDemo
          ? generateWinTypeDemoReels(command.winTypeDemo, paylineCount)
          : command.winDemo
            ? generateWinningDemoReels(this.random, command.winDemo, paylineCount)
            : command.anticipationDemo
              ? generateAnticipationDemoReels(this.random)
              : undefined;
    const cascadeOutcome =
      spinMode !== 'CLASSIC'
        ? calculateCascadeRound(
            this.random,
            bet,
            demoReels,
            paylineCount,
            command.type === 'SPIN' && command.winTypeDemo ? winTypeDemoRefillSymbol : undefined,
          )
        : null;
    const outcome =
      cascadeOutcome ??
      evaluateRound(
        demoReels ?? generateReels(this.random, mode),
        bet,
        mode,
        session.sticky_reels,
        SLOT_MATH,
        paylineCount,
      );
    const winClassification = classifyWin(outcome.totalWinCoins, bet.totalCoins);
    if (
      command.type === 'SPIN' &&
      command.winTypeDemo &&
      winClassification.winType !== command.winTypeDemo
    ) {
      throw new Error('Win type demo did not produce the requested category');
    }
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
      spinMode,
      isWin: outcome.totalWinCoins > 0,
      netCoins: outcome.totalWinCoins - cost,
      ...winClassification,
      bet,
      balance: {
        before: session.balance_coins,
        afterBet: session.balance_coins - cost,
        afterWin: finalBalance,
      },
      ...outcome,
      presentation: {
        anticipation:
          spinMode === 'CASCADE'
            ? null
            : getReelAnticipationHint(
                cascadeOutcome?.cascade.initialReels ?? outcome.reels,
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
