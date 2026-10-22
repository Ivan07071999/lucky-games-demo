import type { Phase } from './PhaseManager';
import { PhaseName, type NextPhase } from './types';

export class IdlePhase implements Phase<typeof PhaseName.idle, NextPhase<typeof PhaseName.idle>> {
  readonly name = PhaseName.idle;

  async enter(signal: AbortSignal): Promise<never> {
    signal.throwIfAborted();

    return new Promise<never>((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      if (signal.aborted) reject(signal.reason);
    });
  }
}
