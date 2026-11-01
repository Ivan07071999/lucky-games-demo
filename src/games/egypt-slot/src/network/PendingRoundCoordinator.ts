import { type RoundResult, type SlotCommand, type SpinMode } from '@lucky-games/contracts';
import { SlotApiError, SlotContractError } from './SlotApiError';
import { SlotHttpClient } from './SlotHttpClient';
import { SlotSessionStorage } from './SlotSessionStorage';
import { SlotSocketClient } from './SlotSocketClient';

export class PendingRoundCoordinator {
  private readonly http: SlotHttpClient;
  private readonly socket: SlotSocketClient;
  private readonly storage: SlotSessionStorage;
  private pendingCommand: SlotCommand | null = null;
  private inFlight = false;

  constructor(http: SlotHttpClient, socket: SlotSocketClient, storage: SlotSessionStorage) {
    this.http = http;
    this.socket = socket;
    this.storage = storage;
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

  async restore(sessionId: string, signal?: AbortSignal): Promise<RoundResult | null> {
    this.pendingCommand = this.storage.readPendingCommand(sessionId);
    const command = this.pendingCommand;
    if (!command) return null;

    try {
      const result = await this.http.getRound(sessionId, command.requestId, signal);
      this.clearPending();
      return result;
    } catch (error) {
      if (error instanceof SlotApiError && error.code === 'ROUND_NOT_FOUND') return null;
      throw error;
    }
  }

  async recoverPendingRound(signal?: AbortSignal): Promise<RoundResult> {
    const command = this.pendingCommand;
    if (!command) throw new SlotApiError('There is no round to recover');
    if (this.inFlight) throw new SlotApiError('A round is already in progress', 'SPIN_IN_PROGRESS');
    this.inFlight = true;

    try {
      try {
        const result = await this.http.getRound(command.sessionId, command.requestId, signal);
        this.clearPending();
        return result;
      } catch (error) {
        if (signal?.aborted) throw error;
        if (error instanceof SlotContractError) throw error;
        if (error instanceof SlotApiError && error.code && error.code !== 'ROUND_NOT_FOUND') {
          throw error;
        }
      }

      return await this.sendCommand(command, signal);
    } finally {
      this.inFlight = false;
    }
  }

  async play(command: SlotCommand, signal?: AbortSignal): Promise<RoundResult> {
    if (this.inFlight) throw new SlotApiError('A round is already in progress', 'SPIN_IN_PROGRESS');
    if (this.pendingCommand && this.pendingCommand.requestId !== command.requestId) {
      throw new SlotApiError('The previous round must be recovered first');
    }
    this.inFlight = true;

    try {
      if (!this.pendingCommand) {
        this.pendingCommand = command;
        this.storage.savePendingCommand(command);
      }
      return await this.sendCommand(command, signal);
    } finally {
      this.inFlight = false;
    }
  }

  private async sendCommand(command: SlotCommand, signal?: AbortSignal): Promise<RoundResult> {
    try {
      const result = await this.socket.send(command, signal);
      this.clearPending();
      return result;
    } catch (error) {
      return this.recoverAfterSendError(command, error, signal);
    }
  }

  private async recoverAfterSendError(
    command: SlotCommand,
    error: unknown,
    signal?: AbortSignal,
  ): Promise<RoundResult> {
    if (signal?.aborted) throw error;

    if (
      error instanceof SlotApiError &&
      error.code &&
      error.code !== 'INTERNAL_ERROR' &&
      error.code !== 'SPIN_IN_PROGRESS'
    ) {
      this.clearPending();
      if (this.isUnsupportedSetting(command, error)) {
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
  }

  private isUnsupportedSetting(command: SlotCommand, error: SlotApiError): boolean {
    if (error.code !== 'INVALID_REQUEST' || error.message !== 'Invalid game command') return false;
    if (command.type !== 'SPIN') return false;

    return Boolean(
      command.paylineCount ||
      command.anticipationDemo ||
      command.winDemo ||
      command.winTypeDemo ||
      command.cascade ||
      command.spinMode === 'CASCADE' ||
      command.spinMode === 'HYBRID',
    );
  }

  private clearPending(): void {
    this.pendingCommand = null;
    this.storage.clearPendingCommand();
  }
}
