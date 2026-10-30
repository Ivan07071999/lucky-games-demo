import {
  SYMBOLS,
  WIN_DEMO_TYPES,
  type RoundResult,
  type SlotCommand,
  type SlotState,
  type SpinMode,
} from '@lucky-games/contracts';
import { SlotApiError } from './SlotApiError';
import { SlotHttpClient } from './SlotHttpClient';
import { SlotSocketClient } from './SlotSocketClient';

const SESSION_KEY = 'egypt-slot:session-id';
const PENDING_KEY = 'egypt-slot:pending-command';
const KNOWN_SYMBOLS = new Set<string>(SYMBOLS);
const KNOWN_WIN_DEMO_TYPES = new Set<string>(WIN_DEMO_TYPES);

export type SpinOptions = Pick<
  Extract<SlotCommand, { type: 'SPIN' }>,
  'bet' | 'level' | 'paylineCount' | 'anticipationDemo' | 'winDemo' | 'winTypeDemo' | 'spinMode'
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

  get hasPendingRound(): boolean {
    return this.pendingCommand !== null;
  }

  get pendingAction(): SlotCommand['type'] | null {
    return this.pendingCommand?.type ?? null;
  }

  get pendingSpinMode(): SpinMode {
    if (this.pendingCommand?.type !== 'SPIN') return 'CLASSIC';
    return this.pendingCommand.spinMode ?? (this.pendingCommand.cascade ? 'CASCADE' : 'CLASSIC');
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

  getState(signal?: AbortSignal): Promise<SlotState> {
    return this.http.getState(this.requireSession(), signal);
  }

  async recoverPendingRound(signal?: AbortSignal): Promise<RoundResult> {
    const command = this.pendingCommand;
    if (!command) throw new SlotApiError('There is no round to recover');
    if (this.inFlight) throw new SlotApiError('A round is already in progress', 'SPIN_IN_PROGRESS');

    try {
      const result = await this.http.getRound(command.sessionId, command.requestId, signal);
      this.clearPending();
      return result;
    } catch (error) {
      if (signal?.aborted) throw error;
      if (error instanceof SlotApiError && error.code && error.code !== 'ROUND_NOT_FOUND') {
        throw error;
      }
    }

    return this.play(command, signal);
  }

  private async play(command: SlotCommand, signal?: AbortSignal): Promise<RoundResult> {
    if (this.inFlight) throw new SlotApiError('A round is already in progress', 'SPIN_IN_PROGRESS');
    if (this.pendingCommand && this.pendingCommand.requestId !== command.requestId) {
      throw new SlotApiError('The previous round must be recovered first');
    }
    this.inFlight = true;
    if (!this.pendingCommand) {
      this.pendingCommand = command;
      this.writeStorage(PENDING_KEY, JSON.stringify(command));
    }

    try {
      const result = await this.socket.send(command, signal);
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
        if (
          command.type === 'SPIN' &&
          (command.paylineCount ||
            command.anticipationDemo ||
            command.winDemo ||
            command.winTypeDemo ||
            command.cascade ||
            command.spinMode === 'CASCADE' ||
            command.spinMode === 'HYBRID') &&
          error.code === 'INVALID_REQUEST' &&
          error.message === 'Invalid game command'
        ) {
          throw new SlotApiError(
            'Restart the game server to enable the selected game setting.',
            'INVALID_REQUEST',
          );
        }
        throw error;
      }
      try {
        const result = await this.http.getRound(command.sessionId, command.requestId, signal);
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
            (!('paylineCount' in value) ||
              value.paylineCount === 5 ||
              value.paylineCount === 7 ||
              value.paylineCount === 9) &&
            (!('anticipationDemo' in value) || typeof value.anticipationDemo === 'boolean') &&
            (!('winDemo' in value) ||
              (value.winDemo !== null &&
                typeof value.winDemo === 'object' &&
                'symbol' in value.winDemo &&
                typeof value.winDemo.symbol === 'string' &&
                KNOWN_SYMBOLS.has(value.winDemo.symbol) &&
                'count' in value.winDemo &&
                (value.winDemo.count === 3 ||
                  value.winDemo.count === 4 ||
                  value.winDemo.count === 5))) &&
            (!('winTypeDemo' in value) ||
              (typeof value.winTypeDemo === 'string' &&
                KNOWN_WIN_DEMO_TYPES.has(value.winTypeDemo))) &&
            (!('spinMode' in value) ||
              value.spinMode === 'CLASSIC' ||
              value.spinMode === 'CASCADE' ||
              value.spinMode === 'HYBRID') &&
            (!('cascade' in value) || typeof value.cascade === 'boolean')))
      ) {
        if (value.type === 'FREE_SPIN') return value as SlotCommand;
        const command = value as Extract<SlotCommand, { type: 'SPIN' }>;
        return {
          type: command.type,
          sessionId: command.sessionId,
          requestId: command.requestId,
          bet: command.bet,
          level: command.level,
          ...(command.paylineCount !== undefined && { paylineCount: command.paylineCount }),
          ...(command.anticipationDemo !== undefined && {
            anticipationDemo: command.anticipationDemo,
          }),
          ...(command.winDemo !== undefined && { winDemo: command.winDemo }),
          ...(command.winTypeDemo !== undefined && { winTypeDemo: command.winTypeDemo }),
          ...(command.spinMode !== undefined && { spinMode: command.spinMode }),
          ...(command.cascade !== undefined && { cascade: command.cascade }),
        };
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
