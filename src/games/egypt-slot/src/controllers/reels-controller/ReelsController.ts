import type { RoundResult, SpinMode } from '@lucky-games/contracts';
import type { GameEvents } from '../../events';
import type { GameEmitter } from '../../events/GameEmitter';
import type { ReelsMatrix } from '../../reels/reelsConfig';
import type { ReelsStore } from '../../stores/ReelsStore';
import type { RoundStore } from '../../stores/RoundStore';
import {
  QuickStopCascadeCommand,
  QuickStopReelsCommand,
  SetReelsCommand,
  ShowFreeSpinsTriggerCommand,
  ShowWildCommand,
  ShowWinLinesCommand,
  StartReelsCommand,
  StartCascadeCommand,
} from '../../reelsMachine/commands';
import type { MainSceneController } from '../main-scene-controller/MainSceneController';
import { landRoundResult, restoreRoundReels } from './roundLanding';
import type { RoundPlayback } from './roundPlayback';

export class ReelsController {
  private readonly scene: MainSceneController;
  private readonly emitter: GameEmitter<GameEvents>;
  private readonly store: ReelsStore;
  private readonly round: RoundStore;
  private readonly isTurboEnabled: () => boolean;
  private readonly unsubscribeQuickStop: () => void;
  private activeRound: RoundPlayback | null = null;

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
    onConfirmedResult: (result: RoundResult) => void,
    signal: AbortSignal,
    spinMode: SpinMode = 'CLASSIC',
  ): Promise<RoundResult> {
    const playback = this.beginRound(signal, spinMode);

    try {
      const result = await this.startAndReceiveResult(
        request,
        previousReels,
        onConfirmedResult,
        playback,
      );
      await this.landWithFallback(result, playback);
      return result;
    } finally {
      this.endRound(playback);
    }
  }

  private beginRound(signal: AbortSignal, spinMode: SpinMode): RoundPlayback {
    const turbo = this.isTurboEnabled();
    this.store.setSpinning(true);
    const playback: RoundPlayback = {
      signal,
      spinMode,
      turbo,
      result: null,
      hybridCascadeActive: false,
    };
    this.activeRound = playback;
    return playback;
  }

  private endRound(playback: RoundPlayback): void {
    if (this.activeRound === playback) this.activeRound = null;
    this.store.setSpinning(false);
  }

  private async startAndReceiveResult(
    request: (signal: AbortSignal) => Promise<RoundResult>,
    previousReels: ReelsMatrix,
    onConfirmedResult: (result: RoundResult) => void,
    playback: RoundPlayback,
  ): Promise<RoundResult> {
    try {
      const command =
        playback.spinMode === 'CASCADE'
          ? new StartCascadeCommand(previousReels, playback.turbo)
          : new StartReelsCommand(playback.turbo);
      this.scene.executeReels(command, playback.signal);

      const result = await request(playback.signal);
      playback.signal.throwIfAborted();
      playback.result = result;
      onConfirmedResult(result);
      this.round.startLanding();
      return result;
    } catch (error) {
      if (!playback.signal.aborted) {
        await restoreRoundReels(this.scene, previousReels, playback);
      }
      throw error;
    }
  }

  private async landWithFallback(result: RoundResult, playback: RoundPlayback): Promise<void> {
    try {
      await landRoundResult(this.scene, this.round, result, playback);
    } catch (error) {
      if (playback.signal.aborted) throw error;
      this.scene.executeReels(new SetReelsCommand(result.reels), playback.signal);
      this.emitter.emit('reel:stopped', 0);
    }
  }

  private readonly requestQuickStop = (): void => {
    if (!this.round.requestQuickStop()) return;

    const playback = this.activeRound;
    if (!playback?.result || playback.signal.aborted) return;

    const result = playback.result;
    const command =
      playback.spinMode === 'CASCADE' || playback.hybridCascadeActive
        ? new QuickStopCascadeCommand(result.reels)
        : new QuickStopReelsCommand(result.cascade?.initialReels ?? result.reels);
    this.scene.executeReels(command, playback.signal);
  };

  async presentResult(result: RoundResult, signal: AbortSignal): Promise<void> {
    if (result.cascade) return;
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
