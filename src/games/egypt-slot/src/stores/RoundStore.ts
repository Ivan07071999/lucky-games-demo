import type { NextAction, RoundResult, SlotState } from '@lucky-games/contracts';
import { makeAutoObservable, observableRef } from 'mobx';

export class RoundStore {
  sessionId: string | null = null;
  nextAction: NextAction = 'SPIN';
  freeSpins: SlotState['freeSpins'] = {
    remaining: 0,
    totalWinCoins: 0,
    stickyReels: [],
  };
  ready = false;
  isSpinning = false;
  errorMessage: string | null = null;
  currentRound: RoundResult | null = null;
  lastRoundResult: RoundResult | null = null;

  constructor() {
    makeAutoObservable(
      this,
      {
        freeSpins: observableRef,
        currentRound: observableRef,
        lastRoundResult: observableRef,
      },
      { autoBind: true },
    );
  }

  get canEditBet(): boolean {
    return !this.isSpinning && this.nextAction !== 'FREE_SPIN';
  }

  applyInitialState(state: SlotState): void {
    this.sessionId = state.sessionId;
    this.nextAction = state.nextAction;
    this.freeSpins = {
      remaining: state.freeSpins.remaining,
      totalWinCoins: state.freeSpins.totalWinCoins,
      stickyReels: [...state.freeSpins.stickyReels],
    };
    this.isSpinning = false;
    this.currentRound = null;
    this.lastRoundResult = null;
    this.errorMessage = null;
    this.ready = true;
  }

  applyRoundResult(result: RoundResult): void {
    this.nextAction = result.nextAction;
    this.freeSpins = {
      remaining: result.features.freeSpins.remaining,
      totalWinCoins: result.features.freeSpins.totalWinCoins,
      stickyReels: [...result.features.wild.stickyReels],
    };
    this.lastRoundResult = result;
    this.errorMessage = null;
  }

  startRound(): void {
    this.isSpinning = true;
    this.errorMessage = null;
    this.currentRound = null;
  }

  receiveRound(result: RoundResult): void {
    this.currentRound = result;
  }

  finishRound(): void {
    this.isSpinning = false;
    this.currentRound = null;
  }

  failRound(message: string): void {
    this.errorMessage = message;
  }
}
