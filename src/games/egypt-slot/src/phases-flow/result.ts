import type { GameEvents } from '../events';
import type { GameEmitter } from '../events/GameEmitter';
import type { ReelsController } from '../controllers/reels-controller/ReelsController';
import type { BalanceController } from '../controllers/balance-controller/BalanceController';
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
  private readonly balance: BalanceController;

  constructor(
    store: SlotStore,
    emitter: GameEmitter<GameEvents>,
    reels: ReelsController,
    balance: BalanceController,
  ) {
    this.store = store;
    this.emitter = emitter;
    this.reels = reels;
    this.balance = balance;
  }

  async enter(signal: AbortSignal): Promise<typeof PhaseName.idle> {
    const result = this.store.round.currentRound;
    if (!result) throw new Error('Round result is missing');

    const presentation = new AbortController();
    const abortPresentation = (): void => presentation.abort(signal.reason);
    signal.addEventListener('abort', abortPresentation, { once: true });
    const unsubscribeSkipWin = this.emitter.on('ui:skipWinRequested', () => {
      if (this.store.round.requestSkipWin()) presentation.abort();
    });

    try {
      signal.throwIfAborted();
      this.store.applyRoundOutcome(result);
      this.store.round.startShowingWin();
      await this.reels.presentResult(result, presentation.signal);
      await this.balance.showWin(result, presentation.signal);
    } catch (error) {
      if (signal.aborted) throw error;
      if (!this.store.round.skipWinRequested) {
        console.error('Egypt slot result presentation failed', error);
      }
    } finally {
      unsubscribeSkipWin();
      signal.removeEventListener('abort', abortPresentation);
      this.balance.settle(result);
      this.store.round.finishRound();
    }

    signal.throwIfAborted();
    this.emitter.emit('round:completed', result);
    return PhaseName.idle;
  }
}
