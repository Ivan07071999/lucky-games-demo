import type { RoundResult, SlotState } from '@lucky-games/contracts';
import { isSlotErrorCode, SlotApiError } from './SlotApiError';
import { parseRoundResult, parseSlotState } from './slotResponseValidation';

const REQUEST_TIMEOUT_MS = 10_000;

export class SlotHttpClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async createSession(signal?: AbortSignal): Promise<SlotState> {
    const data = await this.request('/api/slot/session', {
      method: 'POST',
      body: '{}',
      signal,
    });
    return parseSlotState(data);
  }

  async getState(sessionId: string, signal?: AbortSignal): Promise<SlotState> {
    const data = await this.request('/api/slot/state', { signal, sessionId });
    return parseSlotState(data, sessionId);
  }

  async getRound(sessionId: string, requestId: string, signal?: AbortSignal): Promise<RoundResult> {
    const data = await this.request(`/api/slot/rounds/${encodeURIComponent(requestId)}`, {
      signal,
      sessionId,
    });
    return parseRoundResult(data, requestId);
  }

  private async request(
    path: string,
    options: { method?: string; body?: string; sessionId?: string; signal?: AbortSignal },
  ): Promise<unknown> {
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
      return data;
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
