import type { RoundResult } from '@lucky-games/contracts';
import type { GameEvents } from '../../events';
import type { GameEmitter } from '../../events/GameEmitter';
import type { ReelsMatrix } from '../../reels/reelsConfig';
import type { ReelsStore } from '../../stores/ReelsStore';
import type { RoundStore } from '../../stores/RoundStore';
import {
  LandReelsCommand,
  QuickStopReelsCommand,
  SetReelsCommand,
  ShowFreeSpinsTriggerCommand,
  ShowWildCommand,
  ShowWinLinesCommand,
  StartReelsCommand,
} from '../../reelsMachine/commands';
import type { MainSceneController } from '../main-scene-controller/MainSceneController';

export class ReelsController {
  private readonly scene: MainSceneController;
  private readonly emitter: GameEmitter<GameEvents>;
  private readonly store: ReelsStore;
  private readonly round: RoundStore;
  private readonly isTurboEnabled: () => boolean;
  private readonly unsubscribeQuickStop: () => void;
  private activeResult: RoundResult | null = null;
  private activeSignal: AbortSignal | null = null;

  constructor(
    scene: MainSceneController,
    emitter: GameEmitter<GameEvents>,
    store: ReelsStore,
    round: RoundStore,
    isTurboEnabled: () => boolean = () => false,
  ) {
    this.scene = scene;
    this.emitter = emitter;
    this.store = store;
    this.round = round;
    this.isTurboEnabled = isTurboEnabled;
    this.unsubscribeQuickStop = emitter.on('ui:quickStopRequested', this.requestQuickStop);
  }

  destroy(): void {
    this.unsubscribeQuickStop();
  }

  async playRound(
    request: (signal: AbortSignal) => Promise<RoundResult>,
    previousReels: ReelsMatrix,
    onResultReceived: (result: RoundResult) => void,
    signal: AbortSignal,
  ): Promise<RoundResult> {
    this.store.setSpinning(true);
    this.activeResult = null;
    this.activeSignal = signal;
    const turboThisRound = this.isTurboEnabled();
    let result: RoundResult | null = null;
    try {
      this.scene.executeReels(new StartReelsCommand(turboThisRound), signal);
      this.emitter.emit('spin:started');

      result = await request(signal);
      signal.throwIfAborted();
      this.activeResult = result;
      onResultReceived(result);
      this.round.startLanding();
      await this.scene.executeReels(
        new LandReelsCommand(result.reels, turboThisRound || this.round.quickStopRequested),
        signal,
      );
      this.emitter.emit('spin:landed', result);
      return result;
    } catch (error) {
      if (signal.aborted) throw error;

      if (result) {
        this.scene.executeReels(new SetReelsCommand(result.reels), signal);
        this.emitter.emit('reel:stopped', 0);
        this.emitter.emit('spin:landed', result);
        return result;
      }

      try {
        await this.scene.executeReels(new LandReelsCommand(previousReels), signal);
      } catch {
        this.scene.executeReels(new SetReelsCommand(previousReels), signal);
      }
      throw error;
    } finally {
      this.activeResult = null;
      this.activeSignal = null;
      this.store.setSpinning(false);
    }
  }

  private readonly requestQuickStop = (): void => {
    if (!this.round.requestQuickStop()) return;
    if (!this.activeResult || !this.activeSignal || this.activeSignal.aborted) return;
    this.scene.executeReels(new QuickStopReelsCommand(this.activeResult.reels), this.activeSignal);
  };

  async presentResult(result: RoundResult, signal: AbortSignal): Promise<void> {
    if (result.features.wild.triggered && result.features.wild.expandedReels.length > 0) {
      await this.scene.executeReels(
        new ShowWildCommand(result.features.wild.expandedReels),
        signal,
      );
    }
    signal.throwIfAborted();
    if (result.wins.length > 0) {
      await this.scene.executeReels(new ShowWinLinesCommand(result.wins), signal);
    }
  }

  async presentFreeSpinsTrigger(result: RoundResult, signal: AbortSignal): Promise<void> {
    await this.scene.executeReels(new ShowFreeSpinsTriggerCommand(result.reels), signal);
  }
}
