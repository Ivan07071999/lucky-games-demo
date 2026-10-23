import type { RoundResult, Win } from '@lucky-games/contracts';
import { makeAutoObservable, observableRef } from 'mobx';
import { INITIAL_REELS, type ReelsMatrix } from '../reels/reelsConfig';

export class ReelsStore {
  reels: ReelsMatrix = INITIAL_REELS;
  wins: readonly Win[] = [];
  isSpinning = false;

  constructor() {
    makeAutoObservable(this, { reels: observableRef, wins: observableRef }, { autoBind: true });
  }

  reset(): void {
    this.reels = INITIAL_REELS;
    this.wins = [];
    this.isSpinning = false;
  }

  setSpinning(isSpinning: boolean): void {
    this.isSpinning = isSpinning;
  }

  applyRoundResult(result: RoundResult): void {
    this.reels = result.reels;
    this.wins = result.wins;
  }
}
