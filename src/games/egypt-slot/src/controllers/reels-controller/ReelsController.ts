import type { RoundResult, SpinMode } from '@lucky-games/contracts';
import type { GameEvents } from '../../events';
import type { GameEmitter } from '../../events/GameEmitter';
import type { ReelsMatrix } from '../../reels/reelsConfig';
import type { ReelsStore } from '../../stores/ReelsStore';
import type { RoundStore } from '../../stores/RoundStore';
import {
  LandReelsCommand,
  PlayCascadeCommand,
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

export class ReelsController {
  private readonly scene: MainSceneController;
  private readonly emitter: GameEmitter<GameEvents>;
  private readonly store: ReelsStore;
  private readonly round: RoundStore;
  private readonly isTurboEnabled: () => boolean;
  private readonly unsubscribeQuickStop: () => void;
  private activeResult: RoundResult | null = null;
  private activeSignal: AbortSignal | null = null;
  private spinModeThisRound: SpinMode = 'CLASSIC';
  private hybridCascadeActive = false;

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
    spinMode: SpinMode = 'CLASSIC',
  ): Promise<RoundResult> {
    this.store.setSpinning(true);
    this.activeResult = null;
    this.activeSignal = signal;
    this.spinModeThisRound = spinMode;
    this.hybridCascadeActive = false;
    const turboThisRound = this.isTurboEnabled();
    let result: RoundResult | null = null;
    try {
      this.scene.executeReels(
        spinMode === 'CASCADE'
          ? new StartCascadeCommand(previousReels, turboThisRound)
          : new StartReelsCommand(turboThisRound),
        signal,
      );
      result = await request(signal);
      signal.throwIfAborted();
      this.activeResult = result;
      onResultReceived(result);
      this.round.startLanding();
      if (result.cascade) {
        if (spinMode === 'HYBRID') {
          await this.scene.executeReels(
            new LandReelsCommand(
              result.cascade.initialReels,
              turboThisRound || this.round.quickStopRequested,
              result.presentation?.anticipation ?? null,
            ),
            signal,
          );
        }
        if (spinMode !== 'HYBRID' || result.cascade.steps.length > 0) {
          this.hybridCascadeActive = spinMode === 'HYBRID';
          try {
            await this.scene.executeReels(
              new PlayCascadeCommand(
                result.cascade,
                result.reels,
                turboThisRound,
                this.round.quickStopRequested,
                spinMode === 'HYBRID',
              ),
              signal,
            );
          } finally {
            this.hybridCascadeActive = false;
          }
        }
      } else {
        await this.scene.executeReels(
          new LandReelsCommand(
            result.reels,
            turboThisRound || this.round.quickStopRequested,
            result.presentation?.anticipation ?? null,
          ),
          signal,
        );
      }
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

      if (spinMode === 'CASCADE') {
        this.scene.executeReels(new SetReelsCommand(previousReels), signal);
      } else {
        try {
          await this.scene.executeReels(new LandReelsCommand(previousReels), signal);
        } catch {
          this.scene.executeReels(new SetReelsCommand(previousReels), signal);
        }
      }
      throw error;
    } finally {
      this.activeResult = null;
      this.activeSignal = null;
      this.spinModeThisRound = 'CLASSIC';
      this.hybridCascadeActive = false;
      this.store.setSpinning(false);
    }
  }

  private readonly requestQuickStop = (): void => {
    if (!this.round.requestQuickStop()) return;
    if (!this.activeResult || !this.activeSignal || this.activeSignal.aborted) return;
    this.scene.executeReels(
      this.spinModeThisRound === 'CASCADE' || this.hybridCascadeActive
        ? new QuickStopCascadeCommand(this.activeResult.reels)
        : new QuickStopReelsCommand(
            this.activeResult.cascade?.initialReels ?? this.activeResult.reels,
          ),
      this.activeSignal,
    );
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
