import type { RoundResult, SlotCommand } from '@lucky-games/contracts';
import { SlotApiError } from './SlotApiError';
import { SocketRoundRequest } from './SocketRoundRequest';

const CONNECTION_TIMEOUT_MS = 10_000;

export class SlotSocketClient {
  private readonly baseUrl: string;
  private socket: WebSocket | null = null;
  private connecting: Promise<WebSocket> | null = null;
  private pending: SocketRoundRequest | null = null;
  private sending = false;
  private destroyed = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async send(command: SlotCommand, signal?: AbortSignal): Promise<RoundResult> {
    if (this.destroyed) throw new SlotApiError('WebSocket client has been destroyed');
    if (this.sending) throw new SlotApiError('A round is already in progress', 'SPIN_IN_PROGRESS');
    this.sending = true;

    try {
      const socket = await this.connect(signal);
      if (this.destroyed) throw new SlotApiError('WebSocket client has been destroyed');
      signal?.throwIfAborted();
      const request = new SocketRoundRequest(command, signal);
      this.pending = request;
      try {
        return await request.send(socket);
      } finally {
        if (this.pending === request) this.pending = null;
      }
    } finally {
      this.sending = false;
    }
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
      const timeoutId = window.setTimeout(() => {
        cleanup();
        socket.close();
        reject(new SlotApiError('WebSocket connection timed out'));
      }, CONNECTION_TIMEOUT_MS);
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
        window.clearTimeout(timeoutId);
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
    this.pending?.handleMessage(event.data);
  };

  private readonly onClose = (): void => {
    this.socket = null;
    this.rejectPending(new SlotApiError('WebSocket connection closed'));
  };

  private rejectPending(error: Error): void {
    const pending = this.pending;
    this.pending = null;
    pending?.fail(error);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.rejectPending(new SlotApiError('WebSocket client has been destroyed'));
    this.socket?.close();
    this.socket = null;
  }
}
