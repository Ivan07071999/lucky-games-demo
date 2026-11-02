import type { RoundResult } from '@lucky-games/contracts';
import type { GameEvents } from '../events';
import type { GameEmitter } from '../events/GameEmitter';
import type { ReelsController } from '../controllers/reels-controller/ReelsController';
import type { BalanceController } from '../controllers/balance-controller/BalanceController';
import type { AudioController } from '../controllers/audio-controller/AudioController';
import type { MainSceneController } from '../controllers/main-scene-controller/MainSceneController';
import { ResultPresentationController } from '../controllers/result-presentation-controller/ResultPresentationController';
import type { SlotStore } from '../stores/SlotStore';
import type { Phase } from '../fsm/PhaseManager';
import { getResultNextPhase, PhaseName, type NextPhase } from '../fsm/transitions';

export class ResultPhase implements Phase<
  typeof PhaseName.result,
  NextPhase<typeof PhaseName.result>
> {
  readonly name = PhaseName.result;
  private readonly store: SlotStore;
  private readonly emitter: GameEmitter<GameEvents>;
  private readonly balance: BalanceController;
  private readonly presentation: ResultPresentationController;

  constructor(
    store: SlotStore,
    emitter: GameEmitter<GameEvents>,
    reels: ReelsController,
    balance: BalanceController,
    audio: AudioController,
    scene: MainSceneController,
  ) {
    this.store = store;
    this.emitter = emitter;
    this.balance = balance;
    this.presentation = new ResultPresentationController(
      store.round,
      emitter,
      reels,
      balance,
      audio,
      scene,
    );
  }

  async enter(signal: AbortSignal): Promise<NextPhase<typeof PhaseName.result>> {
    const result = this.requireRound();
    signal.throwIfAborted();
    this.store.applyRoundOutcome(result);
    this.store.round.startShowingWin();

    await this.presentAndFinishRound(result, signal);

    signal.throwIfAborted();
    this.notifyRoundCompleted(result);
    return getResultNextPhase(result.mode, this.store.session.isFreeSpin);
  }

  private requireRound(): RoundResult {
    const result = this.store.round.currentRound;
    if (!result) throw new Error('Round result is missing');
    return result;
  }

  private async presentAndFinishRound(result: RoundResult, signal: AbortSignal): Promise<void> {
    try {
      try {
        await this.presentation.presentWin(result, signal);
      } finally {
        this.store.round.revealWin();
        this.balance.settle(result);
      }
      await this.presentation.presentFreeSpinsTrigger(result, signal);
    } finally {
      this.store.round.finishRound();
    }
  }

  private notifyRoundCompleted(result: RoundResult): void {
    try {
      this.emitter.emit('round:completed', result);
    } catch (error) {
      console.error('Egypt slot round completion listener failed', error);
    }
  }
}
