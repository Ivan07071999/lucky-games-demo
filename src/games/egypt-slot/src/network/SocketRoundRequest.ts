import type { RoundResult, SlotCommand } from '@lucky-games/contracts';
import { SlotApiError, SlotContractError } from './SlotApiError';
import { parseSlotMessage } from './slotResponseValidation';

const ROUND_TIMEOUT_MS = 15_000;

export class SocketRoundRequest {
  private readonly result: Promise<RoundResult>;
  private readonly command: SlotCommand;
  private readonly signal?: AbortSignal;
  private resolveResult!: (result: RoundResult) => void;
  private rejectResult!: (error: unknown) => void;
  private timeoutId: number | null = null;
  private settled = false;

  constructor(command: SlotCommand, signal?: AbortSignal) {
    this.command = command;
    this.signal = signal;
    this.result = new Promise<RoundResult>((resolve, reject) => {
      this.resolveResult = resolve;
      this.rejectResult = reject;
    });
  }

  send(socket: WebSocket): Promise<RoundResult> {
    this.timeoutId = window.setTimeout(() => {
      this.fail(new SlotApiError('WebSocket round timed out'));
    }, ROUND_TIMEOUT_MS);
    this.signal?.addEventListener('abort', this.onAbort, { once: true });

    if (this.signal?.aborted) {
      this.onAbort();
      return this.result;
    }

    try {
      socket.send(JSON.stringify(this.command));
    } catch (error) {
      this.fail(error instanceof Error ? error : new SlotApiError('WebSocket send failed'));
    }

    return this.result;
  }

  handleMessage(data: string): void {
    if (this.settled) return;

    let message: ReturnType<typeof parseSlotMessage>;
    try {
      message = parseSlotMessage(JSON.parse(data), this.command.requestId);
    } catch (error) {
      this.fail(
        error instanceof SlotContractError
          ? error
          : new SlotContractError('WebSocket message', error),
      );
      return;
    }

    if (!message) return;
    if (message.type === 'ERROR') {
      this.fail(new SlotApiError(message.message, message.code));
      return;
    }

    this.settled = true;
    this.cleanup();
    this.resolveResult(message.result);
  }

  fail(error: unknown): void {
    if (this.settled) return;
    this.settled = true;
    this.cleanup();
    this.rejectResult(error);
  }

  private cleanup(): void {
    if (this.timeoutId !== null) window.clearTimeout(this.timeoutId);
    this.signal?.removeEventListener('abort', this.onAbort);
  }

  private readonly onAbort = (): void => {
    this.fail(this.signal?.reason ?? new SlotApiError('Round was cancelled'));
  };
}
