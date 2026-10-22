import { makeAutoObservable } from 'mobx';

export type SpinRequest = Readonly<{
  id: number;
  bet: number;
  level: number;
  coinValueCents: number;
}>;

export class SlotStore {
  bet = 15;
  level = 1;
  coinValueCents = 2;
  coins = 250000;
  lastSpinRequest: SpinRequest | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get canSpin(): boolean {
    return this.bet > 0 && this.coins >= this.bet;
  }

  increaseLevel(): void {
    if (this.level < Number.MAX_SAFE_INTEGER) this.level += 1;
  }

  decreaseLevel(): void {
    this.level = Math.max(1, this.level - 1);
  }

  increaseCoinValue(): void {
    if (this.coinValueCents < Number.MAX_SAFE_INTEGER) this.coinValueCents += 1;
  }

  decreaseCoinValue(): void {
    this.coinValueCents = Math.max(1, this.coinValueCents - 1);
  }

  setBet(bet: number): void {
    this.assertNonNegativeInteger(bet, 'bet');
    this.bet = bet;
  }

  setCoins(coins: number): void {
    this.assertNonNegativeInteger(coins, 'coins');
    this.coins = coins;
  }

  requestSpin(): SpinRequest | null {
    if (!this.canSpin) return null;

    const request: SpinRequest = {
      id: (this.lastSpinRequest?.id ?? 0) + 1,
      bet: this.bet,
      level: this.level,
      coinValueCents: this.coinValueCents,
    };
    this.lastSpinRequest = request;
    return request;
  }

  private assertNonNegativeInteger(value: number, name: string): void {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(`${name} must be a non-negative safe integer`);
    }
  }
}
