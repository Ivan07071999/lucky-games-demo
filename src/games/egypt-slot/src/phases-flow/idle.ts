import type { GameEvents } from '../events';
import type { GameEmitter } from '../events/GameEmitter';
import type { SlotStore } from '../stores/SlotStore';
import type { Phase } from './PhaseManager';
import { PhaseName, type NextPhase } from './types';

export class IdlePhase implements Phase<typeof PhaseName.idle, NextPhase<typeof PhaseName.idle>> {
  readonly name = PhaseName.idle;
  private readonly store: SlotStore;
  private readonly emitter: GameEmitter<GameEvents>;

  constructor(store: SlotStore, emitter: GameEmitter<GameEvents>) {
    this.store = store;
    this.emitter = emitter;
  }

  async enter(signal: AbortSignal): Promise<typeof PhaseName.spinning> {
    signal.throwIfAborted();
    await this.emitter.waitFor('ui:spinRequested', {
      signal,
      filter: () => this.store.canSpin,
    });
    return PhaseName.spinning;
  }
}
