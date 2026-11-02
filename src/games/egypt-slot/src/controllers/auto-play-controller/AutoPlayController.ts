import type { GameEvents } from '../../events';
import type { GameEmitter } from '../../events/GameEmitter';
import type { SlotStore } from '../../stores/SlotStore';

export type AutoPlayStartResult = 'started' | 'insufficientBalance' | 'unavailable';

export class AutoPlayController {
  private readonly store: SlotStore;
  private readonly emitter: GameEmitter<GameEvents>;
  private readonly unsubscribeRoundCompleted: () => void;

  constructor(store: SlotStore, emitter: GameEmitter<GameEvents>) {
    this.store = store;
    this.emitter = emitter;
    this.unsubscribeRoundCompleted = emitter.on('round:completed', (result) => {
      this.store.autoPlay.completeRound(result);
    });
  }

  start(): AutoPlayStartResult {
    const { session, round, balance, bet, autoPlay } = this.store;
    if (
      autoPlay.state !== 'configuring' ||
      !session.ready ||
      !session.sessionId ||
      round.stage !== 'idle' ||
      !!round.errorMessage ||
      session.isFreeSpin
    )
      return 'unavailable';
    if (!this.store.canPlaceBet) {
      return balance.balanceCoins < bet.totalBetCoins ? 'insufficientBalance' : 'unavailable';
    }
    if (!autoPlay.start({ bet: bet.bet, level: bet.level }, balance.balanceCoins))
      return 'unavailable';
    if (!this.store.requestAutoSpin()) {
      autoPlay.cancelStart();
      return 'unavailable';
    }
    this.emitter.emit('ui:spinRequested');
    return 'started';
  }

  tryStartNext(): boolean {
    const { session, round, autoPlay } = this.store;
    if (autoPlay.state === 'pausedForBonus') {
      if (round.errorMessage) autoPlay.stop('roundError');
      else if (!session.isFreeSpin) autoPlay.resumeAfterBonus();
    }
    if (autoPlay.state !== 'running') return false;
    const stopReason = this.store.autoSpinStopReason;
    if (stopReason) {
      autoPlay.stop(stopReason);
      return false;
    }
    if (this.store.requestAutoSpin()) return true;
    autoPlay.stop('unavailable');
    return false;
  }

  requestStop(): void {
    this.store.autoPlay.requestStop();
  }

  onRoundFailed(): void {
    this.store.autoPlay.failRound();
  }

  destroy(): void {
    this.unsubscribeRoundCompleted();
  }
}
