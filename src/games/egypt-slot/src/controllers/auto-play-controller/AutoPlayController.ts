import type { GameEvents } from '../../events';
import type { GameEmitter } from '../../events/GameEmitter';
import type { SlotStore } from '../../stores/SlotStore';
import type { AutoPlayStopReason } from '../../stores/AutoPlayStore';

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
    if (!panel.canPlaceBet) {
      return panel.balanceCoins < panel.totalBetCoins ? 'insufficientBalance' : 'unavailable';
    }
    if (!autoPlay.start({ bet: panel.bet, level: panel.level }, panel.balanceCoins))
      return 'unavailable';
    if (!this.store.requestAutoSpin()) {
      autoPlay.cancelStart();
      return 'unavailable';
    }
    this.emitter.emit('ui:spinRequested');
    return 'started';
  }

  tryStartNext(): boolean {
    const { round, panel, autoPlay } = this.store;
    if (autoPlay.state === 'pausedForBonus') {
      if (round.errorMessage) autoPlay.stop('roundError');
      else if (!round.isFreeSpin) autoPlay.resumeAfterBonus();
    }
    if (autoPlay.state !== 'running') return false;
    if (round.errorMessage) {
      autoPlay.stop('roundError');
      return false;
    }
    const balanceLimit = autoPlay.balanceLimitReason(panel.balanceCoins);
    if (balanceLimit) {
      autoPlay.stop(balanceLimit);
      return false;
    }
    if (this.store.requestAutoSpin()) return true;
    autoPlay.stop(this.nextSpinFailureReason());
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

  private nextSpinFailureReason(): AutoPlayStopReason {
    const { panel, autoPlay } = this.store;
    const bet = autoPlay.lockedBet;
    if (!bet || panel.bet !== bet.bet || panel.level !== bet.level) return 'betMismatch';
    if (panel.balanceCoins < bet.bet * bet.level) return 'insufficientBalance';
    return 'unavailable';
  }
}
