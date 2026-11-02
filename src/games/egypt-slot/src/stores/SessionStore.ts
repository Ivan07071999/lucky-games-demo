import type { NextAction, RoundResult, SlotState } from '@lucky-games/contracts';
import { makeAutoObservable, observableRef } from 'mobx';

export class SessionStore {
  sessionId: string | null = null;
  ready = false;
  nextAction: NextAction = 'SPIN';
  freeSpins: SlotState['freeSpins'] = {
    remaining: 0,
    totalWinCoins: 0,
    stickyReels: [],
  };

  constructor() {
    makeAutoObservable(this, { freeSpins: observableRef }, { autoBind: true });
  }

  get isFreeSpin(): boolean {
    return this.nextAction === 'FREE_SPIN' && this.freeSpins.remaining > 0;
  }

  applyInitialState(state: SlotState): void {
    this.sessionId = state.sessionId;
    this.nextAction = state.nextAction;
    this.freeSpins = {
      remaining: state.freeSpins.remaining,
      totalWinCoins: state.freeSpins.totalWinCoins,
      stickyReels: [...state.freeSpins.stickyReels],
    };
    this.ready = true;
  }

  applyRoundResult(result: RoundResult): void {
    this.nextAction = result.nextAction;
    this.freeSpins = {
      remaining: result.features.freeSpins.remaining,
      totalWinCoins: result.features.freeSpins.totalWinCoins,
      stickyReels: [...result.features.wild.stickyReels],
    };
  }
}
