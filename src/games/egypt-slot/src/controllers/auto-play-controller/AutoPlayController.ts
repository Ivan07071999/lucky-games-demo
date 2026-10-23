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
    const { round, panel, autoPlay } = this.store;
    if (
      autoPlay.state !== 'configuring' ||
      !round.ready ||
      !round.sessionId ||
      round.stage !== 'idle' ||
      !!round.errorMessage ||
      round.isFreeSpin
    )
      return 'unavailable';
    if (!panel.canPlaceBet) return 'insufficientBalance';
    if (
      !autoPlay.start(
        { bet: panel.bet, level: panel.level, coinValueCents: panel.coinValueCents },
        panel.balanceCoins,
      )
    )
      return 'unavailable';
    if (!this.store.requestAutoSpin()) {
      autoPlay.requestStop();
      return 'unavailable';
    }
    this.emitter.emit('ui:spinRequested');
    return 'started';
  }

  tryStartNext(): boolean {
    const { round, autoPlay } = this.store;
    if (autoPlay.state === 'pausedForBonus' && !round.isFreeSpin && !round.errorMessage) {
      autoPlay.resumeAfterBonus();
    }
    if (autoPlay.state !== 'running') return false;
    if (
      round.errorMessage ||
      autoPlay.reachedBalanceLimit(this.store.panel.balanceCoins) ||
      !this.store.requestAutoSpin()
    ) {
      autoPlay.requestStop();
      return false;
    }
    return true;
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
