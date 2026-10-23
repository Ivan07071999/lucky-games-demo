import type { NextAction, RoundResult, SlotState } from '@lucky-games/contracts';
import { makeAutoObservable, observableRef } from 'mobx';

export type RoundStage = 'idle' | 'waitingResult' | 'landing' | 'showingWin';

export class RoundStore {
  sessionId: string | null = null;
  nextAction: NextAction = 'SPIN';
  freeSpins: SlotState['freeSpins'] = {
    remaining: 0,
    totalWinCoins: 0,
    stickyReels: [],
  };
  ready = false;
  stage: RoundStage = 'idle';
  quickStopRequested = false;
  skipWinRequested = false;
  isBonusRound = false;
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
    return !this.isSpinning && !this.isFreeSpin;
  }

  get isSpinning(): boolean {
    return this.stage !== 'idle';
  }

  get isFreeSpin(): boolean {
    return this.nextAction === 'FREE_SPIN' && this.freeSpins.remaining > 0;
  }

  get canQuickStop(): boolean {
    return (
      !this.isBonusRound &&
      !this.quickStopRequested &&
      (this.stage === 'waitingResult' || this.stage === 'landing')
    );
  }

  get canSkipWin(): boolean {
    return (
      !this.isBonusRound &&
      !this.isFreeSpin &&
      !this.skipWinRequested &&
      this.stage === 'showingWin'
    );
  }

  applyInitialState(state: SlotState): void {
    this.sessionId = state.sessionId;
    this.nextAction = state.nextAction;
    this.freeSpins = {
      remaining: state.freeSpins.remaining,
      totalWinCoins: state.freeSpins.totalWinCoins,
      stickyReels: [...state.freeSpins.stickyReels],
    };
    this.stage = 'idle';
    this.quickStopRequested = false;
    this.skipWinRequested = false;
    this.isBonusRound = false;
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
    this.isBonusRound = this.isFreeSpin;
    this.stage = 'waitingResult';
    this.quickStopRequested = false;
    this.skipWinRequested = false;
    this.errorMessage = null;
    this.currentRound = null;
  }

  startLanding(): void {
    this.stage = 'landing';
  }

  startShowingWin(): void {
    this.stage = 'showingWin';
  }

  requestQuickStop(): boolean {
    if (!this.canQuickStop) return false;
    this.quickStopRequested = true;
    return true;
  }

  requestSkipWin(): boolean {
    if (!this.canSkipWin) return false;
    this.skipWinRequested = true;
    return true;
  }

  receiveRound(result: RoundResult): void {
    this.currentRound = result;
  }

  finishRound(): void {
    this.stage = 'idle';
    this.quickStopRequested = false;
    this.skipWinRequested = false;
    this.isBonusRound = false;
    this.currentRound = null;
  }

  failRound(message: string): void {
    this.errorMessage = message;
  }
}
