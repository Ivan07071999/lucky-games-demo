import type { RoundResult } from '@lucky-games/contracts';
import { makeAutoObservable, observableRef } from 'mobx';
import type { SessionStore } from './SessionStore';

export type RoundStage = 'idle' | 'waitingResult' | 'landing' | 'showingWin' | 'recovering';

export class RoundStore {
  readonly session: SessionStore;
  stage: RoundStage = 'idle';
  quickStopRequested = false;
  skipWinRequested = false;
  winDisplayReady = false;
  isBonusRound = false;
  errorMessage: string | null = null;
  currentRound: RoundResult | null = null;

  constructor(session: SessionStore) {
    this.session = session;
    makeAutoObservable(
      this,
      {
        session: false,
        currentRound: observableRef,
      },
      { autoBind: true },
    );
  }

  get canEditBet(): boolean {
    return !this.isSpinning && !this.session.isFreeSpin;
  }

  get isSpinning(): boolean {
    return this.stage !== 'idle';
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
      !this.session.isFreeSpin &&
      !this.skipWinRequested &&
      this.stage === 'showingWin'
    );
  }

  reset(): void {
    this.stage = 'idle';
    this.quickStopRequested = false;
    this.skipWinRequested = false;
    this.winDisplayReady = false;
    this.isBonusRound = false;
    this.currentRound = null;
    this.errorMessage = null;
  }

  clearError(): void {
    this.errorMessage = null;
  }

  startRound(): void {
    this.isBonusRound = this.session.isFreeSpin;
    this.stage = 'waitingResult';
    this.quickStopRequested = false;
    this.skipWinRequested = false;
    this.winDisplayReady = false;
    this.errorMessage = null;
    this.currentRound = null;
  }

  startLanding(): void {
    this.stage = 'landing';
  }

  startShowingWin(): void {
    this.stage = 'showingWin';
  }

  revealWin(): void {
    if (this.currentRound) this.winDisplayReady = true;
  }

  startRecovery(isBonusRound = this.isBonusRound): void {
    this.stage = 'recovering';
    this.isBonusRound = isBonusRound;
    this.quickStopRequested = false;
    this.skipWinRequested = false;
    this.winDisplayReady = false;
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
    this.winDisplayReady = false;
    this.isBonusRound = false;
    this.currentRound = null;
  }

  failRound(message: string): void {
    this.errorMessage = message;
  }
}
