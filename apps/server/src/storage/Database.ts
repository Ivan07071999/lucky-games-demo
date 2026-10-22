import { randomUUID } from 'node:crypto';
import pg from 'pg';
import type { Bet, GameAction, RoundResult } from '@lucky-games/contracts';
import { INITIAL_BALANCE } from '../game/rules.js';

export interface SessionRow {
  id: string;
  balance_coins: number;
  free_spins_remaining: number;
  free_spins_total_win: number;
  sticky_reels: number[];
  last_bet: Bet | null;
}

export class SlotError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export class Database {
  private readonly pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString });
  }

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS slot_sessions (
        id uuid PRIMARY KEY,
        balance_coins bigint NOT NULL CHECK (balance_coins >= 0),
        free_spins_remaining integer NOT NULL DEFAULT 0 CHECK (free_spins_remaining >= 0),
        free_spins_total_win bigint NOT NULL DEFAULT 0,
        sticky_reels jsonb NOT NULL DEFAULT '[]',
        last_bet jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS slot_rounds (
        id uuid PRIMARY KEY,
        session_id uuid NOT NULL REFERENCES slot_sessions(id),
        request_id text NOT NULL,
        action text NOT NULL,
        result jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (session_id, request_id)
      );
    `);
  }

  async createSession(): Promise<SessionRow> {
    const id = randomUUID();
    const result = await this.pool.query<SessionRow>(
      'INSERT INTO slot_sessions (id, balance_coins) VALUES ($1, $2) RETURNING *',
      [id, INITIAL_BALANCE],
    );
    return normalizeSession(result.rows[0]);
  }

  async getSession(id: string): Promise<SessionRow | null> {
    const result = await this.pool.query<SessionRow>('SELECT * FROM slot_sessions WHERE id = $1', [
      id,
    ]);
    return result.rows[0] ? normalizeSession(result.rows[0]) : null;
  }

  async getRound(sessionId: string, requestId: string): Promise<RoundResult | null> {
    const result = await this.pool.query<{ result: RoundResult }>(
      'SELECT result FROM slot_rounds WHERE session_id = $1 AND request_id = $2',
      [sessionId, requestId],
    );
    return result.rows[0]?.result ?? null;
  }

  async executeRound(
    sessionId: string,
    requestId: string,
    action: GameAction,
    calculate: (session: SessionRow) => RoundResult,
  ): Promise<RoundResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const sessionResult = await client.query<SessionRow>(
        'SELECT * FROM slot_sessions WHERE id = $1 FOR UPDATE',
        [sessionId],
      );
      const session = sessionResult.rows[0];
      if (!session) throw new SlotError('SESSION_NOT_FOUND', 'Session was not found');

      const existing = await client.query<{ action: GameAction; result: RoundResult }>(
        'SELECT action, result FROM slot_rounds WHERE session_id = $1 AND request_id = $2',
        [sessionId, requestId],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].action !== action) {
          throw new SlotError(
            'REQUEST_ID_CONFLICT',
            'Request ID already belongs to another action',
          );
        }
        await client.query('COMMIT');
        return existing.rows[0].result;
      }

      const result = calculate(normalizeSession(session));
      await client.query(
        `UPDATE slot_sessions SET balance_coins = $2, free_spins_remaining = $3,
         free_spins_total_win = $4, sticky_reels = $5, last_bet = $6 WHERE id = $1`,
        [
          sessionId,
          result.balance.afterWin,
          result.features.freeSpins.remaining,
          result.features.freeSpins.totalWinCoins,
          JSON.stringify(result.features.wild.stickyReels),
          JSON.stringify(result.bet),
        ],
      );
      await client.query(
        'INSERT INTO slot_rounds (id, session_id, request_id, action, result) VALUES ($1, $2, $3, $4, $5)',
        [result.roundId, sessionId, requestId, action, JSON.stringify(result)],
      );
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

function normalizeSession(row: SessionRow): SessionRow {
  return {
    ...row,
    balance_coins: Number(row.balance_coins),
    free_spins_total_win: Number(row.free_spins_total_win),
  };
}
