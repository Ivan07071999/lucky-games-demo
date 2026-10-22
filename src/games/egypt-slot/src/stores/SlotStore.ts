import type { RoundResult, SlotState } from '@lucky-games/contracts';
import { makeAutoObservable } from 'mobx';
import { PanelStore } from './PanelStore';
import { ReelsStore } from './ReelsStore';
import { RoundStore } from './RoundStore';

export class SlotStore {
  readonly round = new RoundStore();
  readonly panel = new PanelStore(this.round);
  readonly reels = new ReelsStore();

  constructor() {
    makeAutoObservable(this, { round: false, panel: false, reels: false }, { autoBind: true });
  }

  get canSpin(): boolean {
    if (!this.round.ready || !this.round.sessionId || this.round.isSpinning) return false;
    if (this.round.nextAction === 'FREE_SPIN') return this.round.freeSpins.remaining > 0;
    return this.panel.canPlaceBet;
  }

  applyInitialState(state: SlotState): void {
    this.panel.applyInitialState(state);
    this.round.applyInitialState(state);
    this.reels.reset();
  }

  applyRoundResult(result: RoundResult): void {
    this.panel.applyRoundResult(result);
    this.round.applyRoundResult(result);
    this.reels.applyRoundResult(result);
  }
}
