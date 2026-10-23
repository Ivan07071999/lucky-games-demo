import type { RoundResult, SlotState } from '@lucky-games/contracts';
import { makeAutoObservable } from 'mobx';
import { PanelStore } from './PanelStore';
import { AutoPlayStore } from './AutoPlayStore';
import { ReelsStore } from './ReelsStore';
import { RoundStore } from './RoundStore';

export class SlotStore {
  readonly round = new RoundStore();
  readonly autoPlay = new AutoPlayStore();
  readonly panel = new PanelStore(this.round, this.autoPlay);
  readonly reels = new ReelsStore();

  constructor() {
    makeAutoObservable(
      this,
      { round: false, autoPlay: false, panel: false, reels: false },
      { autoBind: true },
    );
  }

  get canSpin(): boolean {
    if (!this.round.ready || !this.round.sessionId || this.round.isSpinning) return false;
    if (this.round.isFreeSpin) return true;
    if (this.autoPlay.isBetLocked || this.autoPlay.state === 'configuring') return false;
    return this.panel.canPlaceBet;
  }

  get canRequestMaxBet(): boolean {
    return (
      this.round.ready &&
      !!this.round.sessionId &&
      this.round.stage === 'idle' &&
      !this.round.errorMessage &&
      !this.round.isFreeSpin &&
      this.autoPlay.canConfigure &&
      this.autoPlay.state !== 'configuring' &&
      this.panel.maxBet !== null
    );
  }

  requestSpin(): boolean {
    if (!this.canSpin) return false;
    this.round.startRound();
    return true;
  }

  requestMaxBetSpin(): 'started' | 'insufficientBalance' | 'unavailable' {
    if (!this.canRequestMaxBet) return 'unavailable';
    if (!this.panel.applyMaxBet()) return 'insufficientBalance';
    this.round.startRound();
    return 'started';
  }

  requestAutoSpin(): boolean {
    const bet = this.autoPlay.lockedBet;
    if (
      !this.round.ready ||
      !this.round.sessionId ||
      this.round.stage !== 'idle' ||
      this.round.isFreeSpin ||
      this.autoPlay.state !== 'running' ||
      !bet ||
      !this.panel.canPlaceBet ||
      this.panel.bet !== bet.bet ||
      this.panel.level !== bet.level ||
      this.panel.coinValueCents !== bet.coinValueCents ||
      !this.autoPlay.markRoundStarted()
    )
      return false;
    this.round.startRound();
    return true;
  }

  applyInitialState(state: SlotState): void {
    this.autoPlay.reset();
    this.panel.applyInitialState(state);
    this.round.applyInitialState(state);
    this.reels.reset();
  }

  applyRoundResult(result: RoundResult): void {
    this.panel.applyRoundResult(result);
    this.applyRoundOutcome(result);
  }

  applyRoundOutcome(result: RoundResult): void {
    this.round.applyRoundResult(result);
    this.reels.applyRoundResult(result);
  }
}
