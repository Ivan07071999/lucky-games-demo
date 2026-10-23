import type { RoundResult, SlotState } from '@lucky-games/contracts';
import { makeAutoObservable } from 'mobx';
import type { RoundStore } from './RoundStore';
import type { AutoPlayStore } from './AutoPlayStore';

export class PanelStore {
  bet = 15;
  level = 1;
  coinValueCents = 2;
  balanceCoins = 0;
  private bets: number[] = [];
  private levels: number[] = [];
  private coinValuesCents: number[] = [];
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
      this.coinValuesCents.includes(this.coinValueCents) &&
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

  increaseCoinValue(): void {
    if (!this.canEditBet) return;
    this.coinValueCents = this.nextValue(this.coinValuesCents, this.coinValueCents);
  }

  decreaseCoinValue(): void {
    if (!this.canEditBet) return;
    this.coinValueCents = this.previousValue(this.coinValuesCents, this.coinValueCents);
  }

  setBet(bet: number): void {
    if (!this.canEditBet) return;
    if (!this.bets.includes(bet)) throw new RangeError('Bet is not allowed');
    this.bet = bet;
  }

  applyInitialState(state: SlotState): void {
    this.bets = [...state.config.bets];
    this.levels = [...state.config.levels];
    this.coinValuesCents = [...state.config.coinValuesCents];
    this.bet = state.lastBet?.bet ?? this.chooseValue(this.bets, this.bet);
    this.level = state.lastBet?.level ?? this.chooseValue(this.levels, this.level);
    this.coinValueCents =
      state.lastBet?.coinValueCents ?? this.chooseValue(this.coinValuesCents, this.coinValueCents);
    this.balanceCoins = state.balanceCoins;
  }

  applyRoundResult(result: RoundResult): void {
    this.bet = result.bet.bet;
    this.level = result.bet.level;
    this.coinValueCents = result.bet.coinValueCents;
    this.balanceCoins = result.balance.afterWin;
  }

  applyConfirmedBet(result: RoundResult): void {
    this.bet = result.bet.bet;
    this.level = result.bet.level;
    this.coinValueCents = result.bet.coinValueCents;
    this.balanceCoins = result.balance.afterBet;
  }

  setBalanceCoins(balanceCoins: number): void {
    this.balanceCoins = balanceCoins;
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
