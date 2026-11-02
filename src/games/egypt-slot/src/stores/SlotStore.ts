import type { RoundResult, SlotState, SpinMode } from '@lucky-games/contracts';
import { makeAutoObservable } from 'mobx';
import type { PhaseName } from '../fsm/transitions';
import { BalanceStore } from './BalanceStore';
import { BetStore } from './BetStore';
import { DemoSettingsStore } from './DemoSettingsStore';
import { AutoPlayStore } from './AutoPlayStore';
import { ReelsStore } from './ReelsStore';
import { RoundStore } from './RoundStore';
import { SessionStore } from './SessionStore';
import { SpinSettingsStore } from './SpinSettingsStore';
import { getNextSpinStopReason, type AutoPlayStopReason } from './autoPlayPolicy';

export class SlotStore {
  readonly session = new SessionStore();
  readonly round = new RoundStore(this.session);
  readonly autoPlay = new AutoPlayStore();
  readonly balance = new BalanceStore();
  readonly bet = new BetStore(this.round, this.autoPlay);
  readonly reels = new ReelsStore();
  readonly spinSettings = new SpinSettingsStore();
  readonly demoSettings = new DemoSettingsStore();
  gameConfig: SlotState['config'] | null = null;
  private phaseName: PhaseName | null = null;

  constructor() {
    makeAutoObservable(
      this,
      {
        session: false,
        round: false,
        autoPlay: false,
        balance: false,
        bet: false,
        reels: false,
        spinSettings: false,
        demoSettings: false,
      },
      { autoBind: true },
    );
  }

  get currentPhase(): PhaseName | null {
    return this.phaseName;
  }

  setPhase(phase: PhaseName | null): void {
    this.phaseName = phase;
  }

  get canSpin(): boolean {
    if (!this.session.ready || !this.session.sessionId || this.round.isSpinning) return false;
    if (this.session.isFreeSpin) return true;
    if (this.autoPlay.isBetLocked || this.autoPlay.state === 'configuring') return false;
    return this.canPlaceBet;
  }

  get canPlaceBet(): boolean {
    return this.bet.isValidSelection && this.balance.balanceCoins >= this.bet.totalBetCoins;
  }

  get canToggleSpinSettings(): boolean {
    return (
      this.session.ready &&
      this.round.stage === 'idle' &&
      !this.session.isFreeSpin &&
      !this.autoPlay.isBetLocked
    );
  }

  get canRequestMaxBet(): boolean {
    return (
      this.session.ready &&
      !!this.session.sessionId &&
      this.round.stage === 'idle' &&
      !this.round.errorMessage &&
      !this.session.isFreeSpin &&
      this.autoPlay.canConfigure &&
      this.autoPlay.state !== 'configuring' &&
      this.bet.maxBet !== null
    );
  }

  get autoSpinStopReason(): AutoPlayStopReason | null {
    return getNextSpinStopReason({
      lockedBet: this.autoPlay.lockedBet,
      currentBet: { bet: this.bet.bet, level: this.bet.level },
      balanceCoins: this.balance.balanceCoins,
      canPlaceBet: this.canPlaceBet,
      hasRoundError: !!this.round.errorMessage,
      initialBalanceCoins: this.autoPlay.initialBalanceCoins,
      netLossLimitCoins: this.autoPlay.netLossLimitCoins,
      netWinLimitCoins: this.autoPlay.netWinLimitCoins,
    });
  }

  selectSpinMode(mode: SpinMode): void {
    if (!this.canToggleSpinSettings) return;
    const nextMode = mode !== 'CLASSIC' && this.spinSettings.spinMode === mode ? 'CLASSIC' : mode;
    this.spinSettings.setSpinMode(nextMode);
    this.demoSettings.reconcileSpinMode(nextMode);
  }

  requestSpin(): boolean {
    if (!this.canSpin) return false;
    this.round.startRound();
    return true;
  }

  requestMaxBetSpin(): 'started' | 'insufficientBalance' | 'unavailable' {
    if (!this.canRequestMaxBet) return 'unavailable';
    const maxBet = this.bet.maxBet;
    if (!maxBet) return 'unavailable';
    if (this.balance.balanceCoins < maxBet.totalCoins) return 'insufficientBalance';
    if (!this.bet.applyMaxBet()) return 'unavailable';
    this.round.startRound();
    return 'started';
  }

  requestAutoSpin(): boolean {
    if (
      !this.session.ready ||
      !this.session.sessionId ||
      this.round.stage !== 'idle' ||
      this.session.isFreeSpin ||
      this.autoPlay.state !== 'running' ||
      this.autoSpinStopReason !== null ||
      !this.autoPlay.markRoundStarted()
    )
      return false;
    this.round.startRound();
    return true;
  }

  applyInitialState(state: SlotState): void {
    this.reconcileState(state);
    this.reels.reset();
  }

  reconcileState(state: SlotState): void {
    this.autoPlay.reset();
    this.gameConfig = state.config;
    this.spinSettings.restorePaylineCount(state.lastBet?.paylineCount);
    this.bet.applyInitialState(state);
    this.balance.applyInitialBalance(state.balanceCoins);
    this.session.applyInitialState(state);
    this.round.reset();
  }

  applyRoundResult(result: RoundResult): void {
    this.bet.applyRoundResult(result);
    this.balance.applyRoundResult(result);
    this.applyRoundOutcome(result);
  }

  applyConfirmedBet(result: RoundResult): void {
    this.bet.applyRoundResult(result);
    this.balance.applyConfirmedBet(result);
  }

  applyRoundOutcome(result: RoundResult): void {
    this.spinSettings.restorePaylineCount(result.bet.paylineCount);
    this.session.applyRoundResult(result);
    this.round.clearError();
    this.reels.applyRoundResult(result);
  }
}
