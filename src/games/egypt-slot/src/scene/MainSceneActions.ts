import type { GameContext } from '../runtime/GameContext';

type BetSelectionOptions = {
  availableBets: readonly number[];
  selectedBet: number;
};

export class MainSceneActions {
  private readonly context: GameContext;

  constructor(context: GameContext) {
    this.context = context;
  }

  getBetSelectionOptions(): BetSelectionOptions | null {
    const { bet } = this.context.slotStore;
    if (!bet.canEditBet) return null;

    return {
      availableBets: bet.availableBets,
      selectedBet: bet.bet,
    };
  }

  handleSpinButtonPress = (): void => {
    const { slotStore, emitter } = this.context;
    const { round } = slotStore;

    if (round.canQuickStop) {
      emitter.emit('ui:quickStopRequested');
    } else if (round.canSkipWin) {
      emitter.emit('ui:skipWinRequested');
    } else if ((!slotStore.session.isFreeSpin || round.errorMessage) && slotStore.requestSpin()) {
      emitter.emit('ui:spinRequested');
    }
  };

  handleMaxBetButtonPress = (): void => {
    const { slotStore, emitter } = this.context;
    const { bet, level } = slotStore.bet;
    const outcome = slotStore.requestMaxBetSpin();

    if (outcome === 'started' && (slotStore.bet.bet !== bet || slotStore.bet.level !== level)) {
      emitter.emit('ui:betChanged');
    }

    if (outcome === 'started') emitter.emit('ui:spinRequested');
    if (outcome === 'insufficientBalance') emitter.emit('ui:maxBetInsufficientBalance');
  };

  shouldOpenAutoPlay(): boolean {
    const { slotStore, autoPlayController } = this.context;

    if (slotStore.autoPlay.isBetLocked) {
      autoPlayController.requestStop();
      return false;
    }

    return (
      slotStore.session.ready &&
      slotStore.round.stage === 'idle' &&
      !slotStore.session.isFreeSpin &&
      !slotStore.round.errorMessage
    );
  }

  selectBet(value: number): void {
    const { bet } = this.context.slotStore;
    const previousBet = bet.bet;

    bet.setBet(value);
    if (bet.bet !== previousBet) this.context.emitter.emit('ui:betChanged');
  }
}
