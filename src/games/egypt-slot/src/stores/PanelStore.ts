import type { RoundResult, SlotState } from '@lucky-games/contracts';
import { makeAutoObservable } from 'mobx';
import type { RoundStore } from './RoundStore';

export class PanelStore {
  bet = 15;
  level = 1;
  coinValueCents = 2;
  balanceCoins = 0;
  private bets: number[] = [];
  private levels: number[] = [];
  private coinValuesCents: number[] = [];
  private readonly round: RoundStore;

  constructor(round: RoundStore) {
    this.round = round;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get canPlaceBet(): boolean {
    return (
      this.bets.includes(this.bet) &&
      this.levels.includes(this.level) &&
      this.coinValuesCents.includes(this.coinValueCents) &&
      this.balanceCoins >= this.bet * this.level
    );
  }

  increaseLevel(): void {
    if (!this.round.canEditBet) return;
    this.level = this.nextValue(this.levels, this.level);
  }

  decreaseLevel(): void {
    if (!this.round.canEditBet) return;
    this.level = this.previousValue(this.levels, this.level);
  }

  increaseCoinValue(): void {
    if (!this.round.canEditBet) return;
    this.coinValueCents = this.nextValue(this.coinValuesCents, this.coinValueCents);
  }

  decreaseCoinValue(): void {
    if (!this.round.canEditBet) return;
    this.coinValueCents = this.previousValue(this.coinValuesCents, this.coinValueCents);
  }

  setBet(bet: number): void {
    if (!this.round.canEditBet) return;
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
