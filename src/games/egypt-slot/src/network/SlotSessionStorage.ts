import { storedSlotCommandSchema, type SlotCommand } from '@lucky-games/contracts';

const SESSION_KEY = 'egypt-slot:session-id';
const PENDING_KEY = 'egypt-slot:pending-command';

export class SlotSessionStorage {
  private storageErrorReported = false;

  readSessionId(): string | null {
    return this.read(SESSION_KEY);
  }

  saveSessionId(sessionId: string): void {
    this.write(SESSION_KEY, sessionId);
  }

  clearSession(): void {
    this.remove(SESSION_KEY);
    this.clearPendingCommand();
  }

  readPendingCommand(sessionId: string): SlotCommand | null {
    const raw = this.read(PENDING_KEY);
    if (!raw) return null;

    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch (error) {
      console.warn('Discarding an invalid saved Egypt slot command', error);
      this.clearPendingCommand();
      return null;
    }

    const parsed = storedSlotCommandSchema.safeParse(value);
    if (parsed.success && parsed.data.sessionId === sessionId) return parsed.data;

    this.clearPendingCommand();
    return null;
  }

  savePendingCommand(command: SlotCommand): void {
    this.write(PENDING_KEY, JSON.stringify(command));
  }

  clearPendingCommand(): void {
    this.remove(PENDING_KEY);
  }

  private read(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      this.reportStorageError(error);
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      this.reportStorageError(error);
    }
  }

  private remove(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      this.reportStorageError(error);
    }
  }

  private reportStorageError(error: unknown): void {
    if (this.storageErrorReported) return;
    this.storageErrorReported = true;
    console.warn(
      'Egypt slot session storage is unavailable; recovery after reload may fail',
      error,
    );
  }
}
