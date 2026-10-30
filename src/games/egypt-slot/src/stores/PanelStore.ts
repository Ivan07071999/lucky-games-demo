import type { RoundResult, SlotState } from '@lucky-games/contracts';
import { makeAutoObservable } from 'mobx';
import type { RoundStore } from './RoundStore';
import type { AutoPlayStore } from './AutoPlayStore';

export class PanelStore {
  bet = 15;
  level = 1;
  // Последний баланс, подтверждённый сервером.
  balanceCoins = 0;
  // Баланс, который видит игрок во время анимации раунда.
  displayBalanceCoins = 0;
  private bets: number[] = [];
  private levels: number[] = [];
  private readonly round: RoundStore;
  private readonly autoPlay: AutoPlayStore;

  constructor(round: RoundStore, autoPlay: AutoPlayStore) {
    this.round = round;
    this.autoPlay = autoPlay;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get canEditBet(): boolean {
    return this.round.canEditBet && !this.autoPlay.isBetLocked;
  }

  get canPlaceBet(): boolean {
    return (
      this.bets.includes(this.bet) &&
      this.levels.includes(this.level) &&
      this.balanceCoins >= this.totalBetCoins
    );
  }

  get totalBetCoins(): number {
    return this.bet * this.level;
  }

  get availableBets(): readonly number[] {
    return this.bets;
  }

  get maxBet(): { bet: number; level: number; totalCoins: number } | null {
    const bet = Math.max(...this.bets);
    const level = Math.max(...this.levels);
    if (!Number.isFinite(bet) || !Number.isFinite(level)) return null;
    return {
      bet,
      level,
      totalCoins: bet * level,
    };
  }

  applyMaxBet(): boolean {
    if (!this.canEditBet) return false;
    const maxBet = this.maxBet;
    if (!maxBet || this.balanceCoins < maxBet.totalCoins) return false;
    this.bet = maxBet.bet;
    this.level = maxBet.level;
    return true;
  }

  increaseLevel(): void {
    if (!this.canEditBet) return;
    this.level = this.nextValue(this.levels, this.level);
  }

  decreaseLevel(): void {
    if (!this.canEditBet) return;
    this.level = this.previousValue(this.levels, this.level);
  }

  setBet(bet: number): void {
    if (!this.canEditBet) return;
    if (!this.bets.includes(bet)) throw new RangeError('Bet is not allowed');
    this.bet = bet;
  }

  applyInitialState(state: SlotState): void {
    this.bets = [...state.config.bets];
    this.levels = [...state.config.levels];
    this.bet = state.lastBet?.bet ?? this.chooseValue(this.bets, this.bet);
    this.level = state.lastBet?.level ?? this.chooseValue(this.levels, this.level);
    this.balanceCoins = state.balanceCoins;
    this.displayBalanceCoins = state.balanceCoins;
  }

  applyRoundResult(result: RoundResult): void {
    this.bet = result.bet.bet;
    this.level = result.bet.level;
    this.balanceCoins = result.balance.afterWin;
    this.displayBalanceCoins = result.balance.afterWin;
  }

  applyConfirmedBet(result: RoundResult): void {
    this.bet = result.bet.bet;
    this.level = result.bet.level;
    this.balanceCoins = result.balance.afterWin;
    this.displayBalanceCoins = result.balance.afterBet;
  }

  setDisplayBalanceCoins(balanceCoins: number): void {
    this.displayBalanceCoins = balanceCoins;
  }

  private chooseValue(values: number[], preferred: number): number {
    return values.includes(preferred) ? preferred : (values[0] ?? preferred);
  }

  private nextValue(values: number[], current: number): number {
    return values.find((value) => value > current) ?? current;
  }

  private previousValue(values: number[], current: number): number {
    return [...values].reverse().find((value) => value < current) ?? current;
  }
}
