import type { BalanceController } from '../controllers/balance-controller/BalanceController';
import type { MainSceneController } from '../controllers/main-scene-controller/MainSceneController';
import type { ReelsController } from '../controllers/reels-controller/ReelsController';
import { RoundRecoveryController } from '../controllers/round-recovery-controller/RoundRecoveryController';
import type { SlotApi } from '../network/SlotApi';
import type { GameMessages } from '../runtime/GameContext';
import type { SlotStore } from '../stores/SlotStore';
import type { Phase } from '../fsm/PhaseManager';
import { PhaseName, type NextPhase } from '../fsm/transitions';

export class RecoveringPhase implements Phase<
  typeof PhaseName.recovering,
  NextPhase<typeof PhaseName.recovering>
> {
  readonly name = PhaseName.recovering;
  private readonly api: SlotApi;
  private readonly store: SlotStore;
  private readonly recovery: RoundRecoveryController;

  constructor(
    api: SlotApi,
    store: SlotStore,
    scene: MainSceneController,
    reels: ReelsController,
    balance: BalanceController,
    messages: GameMessages,
  ) {
    this.api = api;
    this.store = store;
    this.recovery = new RoundRecoveryController(api, store, scene, reels, balance, messages);
  }

  async enter(signal: AbortSignal): Promise<NextPhase<typeof PhaseName.recovering>> {
    signal.throwIfAborted();
    if (this.store.round.stage !== 'recovering') {
      this.store.round.startRecovery(this.api.pendingAction === 'FREE_SPIN');
    }

    const outcome = await this.recovery.recover(signal);
    if (outcome.kind === 'round') return PhaseName.result;
    if (outcome.bonusEnded) return PhaseName.freeSpinsOutro;
    return outcome.isFreeSpin ? PhaseName.freeSpins : PhaseName.idle;
  }
}
