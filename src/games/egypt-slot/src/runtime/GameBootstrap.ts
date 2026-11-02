import type { RoundResult, SlotCommand, SlotState } from '@lucky-games/contracts';
import type { MainSceneController } from '../controllers/main-scene-controller/MainSceneController';
import type { SlotStore } from '../stores/SlotStore';

export type LoadedGame = {
  state: SlotState;
  recoveredRound: RoundResult | null;
};

export class GameBootstrap {
  private readonly store: SlotStore;
  private readonly scene: MainSceneController;

  constructor(store: SlotStore, scene: MainSceneController) {
    this.store = store;
    this.scene = scene;
  }

  prepare({ state, recoveredRound }: LoadedGame, pendingAction: SlotCommand['type'] | null): void {
    this.store.applyInitialState(state);
    if (recoveredRound) this.restoreRound(recoveredRound);

    this.scene.mount();
    if (recoveredRound) {
      this.scene.setTheme(recoveredRound.mode === 'FREE_SPINS' ? 'freeSpins' : 'base');
    } else if (pendingAction) {
      const isFreeSpin = pendingAction === 'FREE_SPIN';
      this.store.round.startRecovery(isFreeSpin);
      this.scene.setTheme(isFreeSpin ? 'freeSpins' : 'base');
    }
  }

  private restoreRound(round: RoundResult): void {
    this.store.round.startRecovery(round.mode === 'FREE_SPINS');
    this.store.applyConfirmedBet(round);
    this.store.reels.applyRoundResult(round);
    this.store.round.receiveRound(round);
  }
}
