import type { RoundResult, SlotCommand, SlotState } from '@lucky-games/contracts';
import { SlotApiError } from './SlotApiError';
import { SlotHttpClient } from './SlotHttpClient';
import { SlotSocketClient } from './SlotSocketClient';

const SESSION_KEY = 'egypt-slot:session-id';
const PENDING_KEY = 'egypt-slot:pending-command';

export type SpinOptions = Pick<
  Extract<SlotCommand, { type: 'SPIN' }>,
  'bet' | 'level' | 'coinValueCents'
>;

export class SlotApi {
  private readonly http: SlotHttpClient;
  private readonly socket: SlotSocketClient;
  private sessionId: string | null = null;
  private pendingCommand: SlotCommand | null = null;
  private inFlight = false;

  constructor(baseUrl = import.meta.env.VITE_SLOT_API_ORIGIN || window.location.origin) {
    this.http = new SlotHttpClient(baseUrl);
    this.socket = new SlotSocketClient(baseUrl);
  }

  async initialize(
    signal?: AbortSignal,
  ): Promise<{ state: SlotState; recoveredRound: RoundResult | null }> {
    const savedId = this.readStorage(SESSION_KEY);
    let state: SlotState | null = null;
    if (savedId) {
      try {
        state = await this.http.getState(savedId, signal);
      } catch (error) {
        if (
          !(error instanceof SlotApiError) ||
          (error.code !== 'SESSION_NOT_FOUND' && error.code !== 'UNAUTHORIZED')
        ) {
          throw error;
        }
        this.removeStorage(SESSION_KEY);
        this.removeStorage(PENDING_KEY);
      }
    }
    state ??= await this.http.createSession(signal);
    signal?.throwIfAborted();

    this.sessionId = state.sessionId;
    this.writeStorage(SESSION_KEY, state.sessionId);
    this.pendingCommand = this.readPendingCommand(state.sessionId);

    let recoveredRound: RoundResult | null = null;
    if (this.pendingCommand) {
      try {
        recoveredRound = await this.http.getRound(
          state.sessionId,
          this.pendingCommand.requestId,
          signal,
        );
        this.clearPending();
      } catch (error) {
        if (!(error instanceof SlotApiError) || error.code !== 'ROUND_NOT_FOUND') throw error;
      }
    }
    return { state, recoveredRound };
  }

  spin(options: SpinOptions, signal?: AbortSignal): Promise<RoundResult> {
    return this.play(
      {
        type: 'SPIN',
        sessionId: this.requireSession(),
        requestId: crypto.randomUUID(),
        ...options,
      },
      signal,
    );
  }

  freeSpin(signal?: AbortSignal): Promise<RoundResult> {
    return this.play(
      { type: 'FREE_SPIN', sessionId: this.requireSession(), requestId: crypto.randomUUID() },
      signal,
    );
  }

  private async play(command: SlotCommand, signal?: AbortSignal): Promise<RoundResult> {
    if (this.inFlight) throw new SlotApiError('A round is already in progress', 'SPIN_IN_PROGRESS');
    this.inFlight = true;
    const actualCommand = this.pendingCommand ?? command;
    if (!this.pendingCommand) {
      this.pendingCommand = actualCommand;
      this.writeStorage(PENDING_KEY, JSON.stringify(actualCommand));
    }

    try {
      const result = await this.socket.send(actualCommand, signal);
      this.clearPending();
      return result;
    } catch (error) {
      if (signal?.aborted) throw error;
      if (
        error instanceof SlotApiError &&
        error.code &&
        error.code !== 'INTERNAL_ERROR' &&
        error.code !== 'SPIN_IN_PROGRESS'
      ) {
        this.clearPending();
        throw error;
      }
      try {
        const result = await this.http.getRound(
          actualCommand.sessionId,
          actualCommand.requestId,
          signal,
        );
        this.clearPending();
        return result;
      } catch (recoveryError) {
        if (!(recoveryError instanceof SlotApiError) || recoveryError.code !== 'ROUND_NOT_FOUND') {
          throw recoveryError;
        }
      }
      throw error;
    } finally {
      this.inFlight = false;
    }
  }

  private requireSession(): string {
    if (!this.sessionId) throw new SlotApiError('Session has not been initialized');
    return this.sessionId;
  }

  private readPendingCommand(sessionId: string): SlotCommand | null {
    const raw = this.readStorage(PENDING_KEY);
    if (!raw) return null;
    try {
      const value: unknown = JSON.parse(raw);
      if (
        value &&
        typeof value === 'object' &&
        'sessionId' in value &&
        value.sessionId === sessionId &&
        'requestId' in value &&
        typeof value.requestId === 'string' &&
        'type' in value &&
        (value.type === 'SPIN' || value.type === 'FREE_SPIN') &&
        (value.type === 'FREE_SPIN' ||
          ('bet' in value &&
            Number.isInteger(value.bet) &&
            'level' in value &&
            Number.isInteger(value.level) &&
            'coinValueCents' in value &&
            Number.isInteger(value.coinValueCents)))
      ) {
        return value as SlotCommand;
      }
    } catch {
      // Повреждённая запись не должна блокировать запуск игры.
    }
    this.removeStorage(PENDING_KEY);
    return null;
  }

  private clearPending(): void {
    this.pendingCommand = null;
    this.removeStorage(PENDING_KEY);
  }

  private readStorage(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Игру можно продолжить без восстановления после перезагрузки вкладки.
    }
  }

  private removeStorage(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Хранилище может быть недоступно в приватном режиме браузера.
    }
  }

  destroy(): void {
    this.socket.destroy();
  }
}
