import type { RoundResult } from '@lucky-games/contracts';
import { makeAutoObservable, observableRef } from 'mobx';
import { INITIAL_REELS, type ReelsMatrix } from '../reels/reelsConfig';

export class ReelsStore {
  reels: ReelsMatrix = INITIAL_REELS;

  constructor() {
    makeAutoObservable(this, { reels: observableRef }, { autoBind: true });
  }

  reset(): void {
    this.reels = INITIAL_REELS;
  }

  applyRoundResult(result: RoundResult): void {
    this.reels = result.reels;
  }
}
