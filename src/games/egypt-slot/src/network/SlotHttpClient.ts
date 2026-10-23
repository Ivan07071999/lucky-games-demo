import type { RoundResult, SlotState } from '@lucky-games/contracts';
import { isSlotErrorCode, SlotApiError, SlotContractError } from './SlotApiError';

const REQUEST_TIMEOUT_MS = 10_000;

export class SlotHttpClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async createSession(signal?: AbortSignal): Promise<SlotState> {
    return this.readState('/api/slot/session', { method: 'POST', body: '{}', signal });
  }

  async getState(sessionId: string, signal?: AbortSignal): Promise<SlotState> {
    return this.readState('/api/slot/state', { signal, sessionId });
  }

  getRound(sessionId: string, requestId: string, signal?: AbortSignal): Promise<RoundResult> {
    return this.request(`/api/slot/rounds/${encodeURIComponent(requestId)}`, { signal, sessionId });
  }

  private async readState(
    path: string,
    options: { method?: string; body?: string; sessionId?: string; signal?: AbortSignal },
  ): Promise<SlotState> {
    const state = await this.request<unknown>(path, options);
    if (
      !state ||
      typeof state !== 'object' ||
      !('config' in state) ||
      !state.config ||
      typeof state.config !== 'object' ||
      !('bets' in state.config) ||
      !Array.isArray(state.config.bets) ||
      state.config.bets.length === 0 ||
      !('levels' in state.config) ||
      !Array.isArray(state.config.levels) ||
      state.config.levels.length === 0 ||
      !('coinValuesCents' in state.config) ||
      !Array.isArray(state.config.coinValuesCents)
    ) {
      throw new SlotContractError();
    }
    return state as SlotState;
  }

  private async request<Result>(
    path: string,
    options: { method?: string; body?: string; sessionId?: string; signal?: AbortSignal },
  ): Promise<Result> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body) headers['Content-Type'] = 'application/json';
    if (options.sessionId) headers.Authorization = `Bearer ${options.sessionId}`;

    const controller = new AbortController();
    const onAbort = () => controller.abort(options.signal?.reason);
    options.signal?.addEventListener('abort', onAbort, { once: true });
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    if (options.signal?.aborted) onAbort();

    try {
      const response = await fetch(new URL(path, this.baseUrl), {
        method: options.method ?? 'GET',
        body: options.body,
        headers,
        signal: controller.signal,
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const error = data as { code?: unknown; message?: unknown } | null;
        throw new SlotApiError(
          typeof error?.message === 'string' ? error.message : `HTTP ${response.status}`,
          isSlotErrorCode(error?.code) ? error.code : null,
        );
      }
      if (!data || typeof data !== 'object') throw new SlotApiError('Invalid server response');
      return data as Result;
    } catch (error) {
      if (controller.signal.aborted && !options.signal?.aborted) {
        throw new SlotApiError('HTTP request timed out');
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
      options.signal?.removeEventListener('abort', onAbort);
    }
  }
}
