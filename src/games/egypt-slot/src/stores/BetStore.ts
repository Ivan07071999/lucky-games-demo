import type { RoundResult, SlotState } from '@lucky-games/contracts';
import { makeAutoObservable } from 'mobx';
import type { AutoPlayStore } from './AutoPlayStore';
import type { RoundStore } from './RoundStore';

export class BetStore {
  bet = 15;
  level = 1;
  private bets: number[] = [];
  private levels: number[] = [];
  readonly round: RoundStore;
  readonly autoPlay: AutoPlayStore;

  constructor(round: RoundStore, autoPlay: AutoPlayStore) {
    this.round = round;
    this.autoPlay = autoPlay;
    makeAutoObservable(this, { round: false, autoPlay: false }, { autoBind: true });
  }

  get canEditBet(): boolean {
    return this.round.canEditBet && !this.autoPlay.isBetLocked;
  }

  get isValidSelection(): boolean {
    return this.bets.includes(this.bet) && this.levels.includes(this.level);
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
    return { bet, level, totalCoins: bet * level };
  }

  applyMaxBet(): boolean {
    if (!this.canEditBet) return false;
    const maxBet = this.maxBet;
    if (!maxBet) return false;
    this.bet = maxBet.bet;
    this.level = maxBet.level;
    return true;
  }

  increaseLevel(): void {
    if (!this.canEditBet) return;
    this.level = this.levels.find((value) => value > this.level) ?? this.level;
  }

  decreaseLevel(): void {
    if (!this.canEditBet) return;
    this.level = [...this.levels].reverse().find((value) => value < this.level) ?? this.level;
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
  }

  applyRoundResult(result: RoundResult): void {
    this.bet = result.bet.bet;
    this.level = result.bet.level;
  }

  private chooseValue(values: number[], preferred: number): number {
    return values.includes(preferred) ? preferred : (values[0] ?? preferred);
  }
}
