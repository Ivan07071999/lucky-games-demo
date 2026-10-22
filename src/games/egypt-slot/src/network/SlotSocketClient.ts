import type { RoundResult, SlotCommand } from '@lucky-games/contracts';
import { isSlotErrorCode, SlotApiError } from './SlotApiError';

type PendingRequest = {
  requestId: string;
  resolve: (result: RoundResult) => void;
  reject: (error: Error) => void;
};

export class SlotSocketClient {
  private readonly baseUrl: string;
  private socket: WebSocket | null = null;
  private connecting: Promise<WebSocket> | null = null;
  private pending: PendingRequest | null = null;
  private destroyed = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async send(command: SlotCommand, signal?: AbortSignal): Promise<RoundResult> {
    if (this.destroyed) throw new SlotApiError('WebSocket client has been destroyed');
    if (this.pending) throw new SlotApiError('A round is already in progress', 'SPIN_IN_PROGRESS');

    const socket = await this.connect(signal);
    signal?.throwIfAborted();

    return new Promise<RoundResult>((resolve, reject) => {
      const onAbort = () => {
        this.pending = null;
        reject(signal?.reason ?? new SlotApiError('Round was cancelled'));
      };
      signal?.addEventListener('abort', onAbort, { once: true });
      this.pending = {
        requestId: command.requestId,
        resolve: (result) => {
          signal?.removeEventListener('abort', onAbort);
          resolve(result);
        },
        reject: (error) => {
          signal?.removeEventListener('abort', onAbort);
          reject(error);
        },
      };

      try {
        socket.send(JSON.stringify(command));
      } catch (error) {
        this.rejectPending(
          error instanceof Error ? error : new SlotApiError('WebSocket send failed'),
        );
      }
    });
  }

  private async connect(signal?: AbortSignal): Promise<WebSocket> {
    if (this.socket?.readyState === WebSocket.OPEN) return this.socket;
    if (this.connecting) return this.connecting;

    const url = new URL('/api/slot/ws', this.baseUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.addEventListener('message', this.onMessage);
    socket.addEventListener('close', this.onClose);

    this.connecting = new Promise<WebSocket>((resolve, reject) => {
      const onOpen = () => {
        cleanup();
        resolve(socket);
      };
      const onFailure = () => {
        cleanup();
        reject(new SlotApiError('WebSocket connection failed'));
      };
      const onAbort = () => {
        cleanup();
        socket.close();
        reject(signal?.reason ?? new SlotApiError('Connection was cancelled'));
      };
      const cleanup = () => {
        socket.removeEventListener('open', onOpen);
        socket.removeEventListener('error', onFailure);
        socket.removeEventListener('close', onFailure);
        signal?.removeEventListener('abort', onAbort);
      };

      socket.addEventListener('open', onOpen, { once: true });
      socket.addEventListener('error', onFailure, { once: true });
      socket.addEventListener('close', onFailure, { once: true });
      signal?.addEventListener('abort', onAbort, { once: true });
      if (signal?.aborted) onAbort();
    }).finally(() => {
      this.connecting = null;
    });

    return this.connecting;
  }

  private readonly onMessage = (event: MessageEvent<string>): void => {
    const pending = this.pending;
    if (!pending) return;
    let message: unknown;
    try {
      message = JSON.parse(event.data);
    } catch {
      this.rejectPending(new SlotApiError('Invalid WebSocket response'));
      return;
    }
    if (!message || typeof message !== 'object' || !('type' in message)) {
      this.rejectPending(new SlotApiError('Invalid WebSocket response'));
      return;
    }
    if (message.type === 'ERROR') {
      if (
        !('requestId' in message) ||
        !('code' in message) ||
        !('message' in message) ||
        typeof message.message !== 'string'
      ) {
        this.rejectPending(new SlotApiError('Invalid WebSocket error response'));
        return;
      }
      if (message.requestId && message.requestId !== pending.requestId) return;
      this.rejectPending(
        new SlotApiError(message.message, isSlotErrorCode(message.code) ? message.code : null),
      );
      return;
    }
    if (message.type === 'ROUND_RESULT' && 'requestId' in message) {
      if (message.requestId !== pending.requestId) return;
    }
    if (
      message.type !== 'ROUND_RESULT' ||
      !('requestId' in message) ||
      !('result' in message) ||
      !message.result ||
      typeof message.result !== 'object'
    ) {
      this.rejectPending(new SlotApiError('Unexpected WebSocket response'));
      return;
    }
    this.pending = null;
    pending.resolve(message.result as RoundResult);
  };

  private readonly onClose = (): void => {
    this.socket = null;
    this.rejectPending(new SlotApiError('WebSocket connection closed'));
  };

  private rejectPending(error: Error): void {
    const pending = this.pending;
    this.pending = null;
    pending?.reject(error);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.rejectPending(new SlotApiError('WebSocket client has been destroyed'));
    this.socket?.close();
    this.socket = null;
  }
}
