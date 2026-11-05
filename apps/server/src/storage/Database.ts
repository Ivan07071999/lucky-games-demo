import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Sqlite from 'better-sqlite3';
import type { Bet, GameAction, RoundResult, SlotErrorCode } from '@lucky-games/contracts';
import { INITIAL_BALANCE } from '../game/rules.js';

export interface SessionRow {
  id: string;
  balance_coins: number;
  free_spins_remaining: number;
  free_spins_total_win: number;
  sticky_reels: number[];
  last_bet: Bet | null;
}

interface StoredSessionRow extends Omit<SessionRow, 'sticky_reels' | 'last_bet'> {
  sticky_reels: string;
  last_bet: string | null;
}

interface StoredRoundRow {
  action: GameAction;
  result: string;
}

export class SlotError extends Error {
  constructor(
    readonly code: SlotErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export class Database {
  private readonly connection: Sqlite.Database;

  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.connection = new Sqlite(path, { timeout: 5000 });
    this.connection.pragma('foreign_keys = ON');
  }

  async initialize(): Promise<void> {
    this.connection.exec(`
      CREATE TABLE IF NOT EXISTS slot_sessions (
        id TEXT PRIMARY KEY,
        balance_coins INTEGER NOT NULL CHECK (balance_coins >= 0),
        free_spins_remaining INTEGER NOT NULL DEFAULT 0 CHECK (free_spins_remaining >= 0),
        free_spins_total_win INTEGER NOT NULL DEFAULT 0,
        sticky_reels TEXT NOT NULL DEFAULT '[]',
        last_bet TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS slot_rounds (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES slot_sessions(id),
        request_id TEXT NOT NULL,
        action TEXT NOT NULL,
        result TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (session_id, request_id)
      );
    `);
  }

  async createSession(): Promise<SessionRow> {
    const id = randomUUID();
    this.connection
      .prepare('INSERT INTO slot_sessions (id, balance_coins) VALUES (?, ?)')
      .run(id, INITIAL_BALANCE);
    return this.readSession(id)!;
  }

  async getSession(id: string): Promise<SessionRow | null> {
    return this.readSession(id);
  }

  async getRound(sessionId: string, requestId: string): Promise<RoundResult | null> {
    const row = this.connection
      .prepare('SELECT result FROM slot_rounds WHERE session_id = ? AND request_id = ?')
      .get(sessionId, requestId) as Pick<StoredRoundRow, 'result'> | undefined;
    return row ? normalizeRound(JSON.parse(row.result) as RoundResult) : null;
  }

  async executeRound(
    sessionId: string,
    requestId: string,
    action: GameAction,
    calculate: (session: SessionRow) => RoundResult,
  ): Promise<RoundResult> {
    const transaction = this.connection.transaction(() => {
      const session = this.readSession(sessionId);
      if (!session) throw new SlotError('SESSION_NOT_FOUND', 'Session was not found');

      const existing = this.connection
        .prepare('SELECT action, result FROM slot_rounds WHERE session_id = ? AND request_id = ?')
        .get(sessionId, requestId) as StoredRoundRow | undefined;
      if (existing) {
        if (existing.action !== action) {
          throw new SlotError(
            'REQUEST_ID_CONFLICT',
            'Request ID already belongs to another action',
          );
        }
        return normalizeRound(JSON.parse(existing.result) as RoundResult);
      }

      const result = calculate(session);
      this.connection
        .prepare(
          `
          UPDATE slot_sessions
          SET balance_coins = ?, free_spins_remaining = ?, free_spins_total_win = ?,
              sticky_reels = ?, last_bet = ?
          WHERE id = ?
        `,
        )
        .run(
          result.balance.afterWin,
          result.features.freeSpins.remaining,
          result.features.freeSpins.totalWinCoins,
          JSON.stringify(result.features.wild.stickyReels),
          JSON.stringify(result.bet),
          sessionId,
        );
      this.connection
        .prepare(
          `
          INSERT INTO slot_rounds (id, session_id, request_id, action, result)
          VALUES (?, ?, ?, ?, ?)
        `,
        )
        .run(result.roundId, sessionId, requestId, action, JSON.stringify(result));
      return result;
    });

    return transaction.immediate();
  }

  async close(): Promise<void> {
    this.connection.close();
  }

  private readSession(id: string): SessionRow | null {
    const row = this.connection
      .prepare(
        `
        SELECT id, balance_coins, free_spins_remaining, free_spins_total_win,
               sticky_reels, last_bet
        FROM slot_sessions WHERE id = ?
      `,
      )
      .get(id) as StoredSessionRow | undefined;
    if (!row) return null;
    return {
      ...row,
      sticky_reels: JSON.parse(row.sticky_reels) as number[],
      last_bet: row.last_bet ? normalizeBet(JSON.parse(row.last_bet) as Bet) : null,
    };
  }
}

function normalizeRound(result: RoundResult): RoundResult {
  return { ...result, bet: normalizeBet(result.bet) };
}

function normalizeBet(bet: Bet): Bet {
  const { bet: stake, level, totalCoins, paylineCount } = bet;
  return { bet: stake, level, totalCoins, ...(paylineCount === undefined ? {} : { paylineCount }) };
}
