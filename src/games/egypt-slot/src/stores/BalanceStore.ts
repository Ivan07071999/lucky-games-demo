import type { RoundResult } from '@lucky-games/contracts';
import { makeAutoObservable } from 'mobx';

export class BalanceStore {
  balanceCoins = 0;
  displayBalanceCoins = 0;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  applyInitialBalance(balanceCoins: number): void {
    this.balanceCoins = balanceCoins;
    this.displayBalanceCoins = balanceCoins;
  }

  applyRoundResult(result: RoundResult): void {
    this.balanceCoins = result.balance.afterWin;
    this.displayBalanceCoins = result.balance.afterWin;
  }

  applyConfirmedBet(result: RoundResult): void {
    this.balanceCoins = result.balance.afterWin;
    this.displayBalanceCoins = result.balance.afterBet;
  }

  setDisplayBalanceCoins(balanceCoins: number): void {
    this.displayBalanceCoins = balanceCoins;
  }
}
