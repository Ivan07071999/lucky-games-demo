import type { GameEvents } from '../events';
import type { AutoPlayController } from '../controllers/auto-play-controller/AutoPlayController';
import type { GameEmitter } from '../events/GameEmitter';
import type { SlotStore } from '../stores/SlotStore';
import type { Phase } from '../fsm/PhaseManager';
import { PhaseName, type NextPhase } from '../fsm/transitions';

export class IdlePhase implements Phase<typeof PhaseName.idle, NextPhase<typeof PhaseName.idle>> {
  readonly name = PhaseName.idle;
  private readonly store: SlotStore;
  private readonly emitter: GameEmitter<GameEvents>;
  private readonly autoPlay: AutoPlayController;

  constructor(store: SlotStore, emitter: GameEmitter<GameEvents>, autoPlay: AutoPlayController) {
    this.store = store;
    this.emitter = emitter;
    this.autoPlay = autoPlay;
  }

  async enter(signal: AbortSignal): Promise<NextPhase<typeof PhaseName.idle>> {
    signal.throwIfAborted();
    if (this.store.round.stage === 'waitingResult') {
      return this.store.session.isFreeSpin ? PhaseName.freeSpins : PhaseName.spinning;
    }
    if (this.store.session.isFreeSpin && !this.store.round.errorMessage) {
      return PhaseName.freeSpins;
    }
    if (this.autoPlay.tryStartNext()) return PhaseName.spinning;

    await this.emitter.waitFor('ui:spinRequested', {
      signal,
      filter: () => this.store.round.stage === 'waitingResult',
    });
    return this.store.session.isFreeSpin ? PhaseName.freeSpins : PhaseName.spinning;
  }
}
