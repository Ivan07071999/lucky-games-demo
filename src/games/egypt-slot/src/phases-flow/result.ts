import type { GameEvents } from '../events';
import type { GameEmitter } from '../events/GameEmitter';
import type { ReelsController } from '../controllers/reels-controller/ReelsController';
import type { SlotStore } from '../stores/SlotStore';
import type { Phase } from './PhaseManager';
import { PhaseName, type NextPhase } from './types';

export class ResultPhase implements Phase<
  typeof PhaseName.result,
  NextPhase<typeof PhaseName.result>
> {
  readonly name = PhaseName.result;
  private readonly store: SlotStore;
  private readonly emitter: GameEmitter<GameEvents>;
  private readonly reels: ReelsController;

  constructor(store: SlotStore, emitter: GameEmitter<GameEvents>, reels: ReelsController) {
    this.store = store;
    this.emitter = emitter;
    this.reels = reels;
  }

  async enter(signal: AbortSignal): Promise<typeof PhaseName.idle> {
    const result = this.store.round.currentRound;
    if (!result) throw new Error('Round result is missing');

    this.store.applyRoundResult(result);
    try {
      await this.reels.presentResult(result, signal);
      signal.throwIfAborted();
      this.emitter.emit('round:completed', result);
      return PhaseName.idle;
    } finally {
      this.store.round.finishRound();
    }
  }
}
