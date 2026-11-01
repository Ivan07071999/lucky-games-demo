import {
  type RoundResult,
  type SlotCommand,
  type SlotState,
  type SpinOptions,
  type SpinMode,
} from '@lucky-games/contracts';
import { PendingRoundCoordinator } from './PendingRoundCoordinator';
import { SlotApiError } from './SlotApiError';
import { SlotHttpClient } from './SlotHttpClient';
import { SlotSessionStorage } from './SlotSessionStorage';
import { SlotSocketClient } from './SlotSocketClient';

export class SlotApi {
  private readonly http: SlotHttpClient;
  private readonly socket: SlotSocketClient;
  private readonly storage = new SlotSessionStorage();
  private readonly rounds: PendingRoundCoordinator;
  private sessionId: string | null = null;

  constructor(baseUrl = import.meta.env.VITE_SLOT_API_ORIGIN || window.location.origin) {
    this.http = new SlotHttpClient(baseUrl);
    this.socket = new SlotSocketClient(baseUrl);
    this.rounds = new PendingRoundCoordinator(this.http, this.socket, this.storage);
  }

  get hasPendingRound(): boolean {
    return this.rounds.hasPendingRound;
  }

  get pendingAction(): SlotCommand['type'] | null {
    return this.rounds.pendingAction;
  }

  get pendingSpinMode(): SpinMode {
    return this.rounds.pendingSpinMode;
  }

  async initialize(
    signal?: AbortSignal,
  ): Promise<{ state: SlotState; recoveredRound: RoundResult | null }> {
    const state = await this.loadSession(signal);
    signal?.throwIfAborted();

    this.sessionId = state.sessionId;
    this.storage.saveSessionId(state.sessionId);

    const recoveredRound = await this.rounds.restore(state.sessionId, signal);
    return { state, recoveredRound };
  }

  private async loadSession(signal?: AbortSignal): Promise<SlotState> {
    const savedId = this.storage.readSessionId();
    if (savedId) {
      try {
        return await this.http.getState(savedId, signal);
      } catch (error) {
        if (
          !(error instanceof SlotApiError) ||
          (error.code !== 'SESSION_NOT_FOUND' && error.code !== 'UNAUTHORIZED')
        ) {
          throw error;
        }
        this.storage.clearSession();
      }
    }
    return this.http.createSession(signal);
  }

  spin(options: SpinOptions, signal?: AbortSignal): Promise<RoundResult> {
    return this.rounds.play(
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
    return this.rounds.play(
      { type: 'FREE_SPIN', sessionId: this.requireSession(), requestId: crypto.randomUUID() },
      signal,
    );
  }

  getState(signal?: AbortSignal): Promise<SlotState> {
    return this.http.getState(this.requireSession(), signal);
  }

  recoverPendingRound(signal?: AbortSignal): Promise<RoundResult> {
    return this.rounds.recoverPendingRound(signal);
  }

  private requireSession(): string {
    if (!this.sessionId) throw new SlotApiError('Session has not been initialized');
    return this.sessionId;
  }

  destroy(): void {
    this.socket.destroy();
  }
}
