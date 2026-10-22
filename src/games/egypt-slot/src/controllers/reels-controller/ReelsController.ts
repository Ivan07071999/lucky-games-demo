import type { RoundResult } from '@lucky-games/contracts';
import type { GameEvents } from '../../events';
import type { GameEmitter } from '../../events/GameEmitter';
import type { ReelsMatrix } from '../../reels/reelsConfig';
import {
  LandReelsCommand,
  SetReelsCommand,
  ShowWildCommand,
  ShowWinLinesCommand,
  StartReelsCommand,
} from '../../reelsMachine/commands';
import type { MainSceneController } from '../main-scene-controller/MainSceneController';

export class ReelsController {
  private readonly scene: MainSceneController;
  private readonly emitter: GameEmitter<GameEvents>;

  constructor(scene: MainSceneController, emitter: GameEmitter<GameEvents>) {
    this.scene = scene;
    this.emitter = emitter;
  }

  async playRound(
    request: (signal: AbortSignal) => Promise<RoundResult>,
    previousReels: ReelsMatrix,
    signal: AbortSignal,
  ): Promise<RoundResult> {
    this.scene.executeReels(new StartReelsCommand(), signal);
    this.emitter.emit('spin:started');

    let result: RoundResult | null = null;
    try {
      result = await request(signal);
      signal.throwIfAborted();
      await this.scene.executeReels(new LandReelsCommand(result.reels), signal);
      this.emitter.emit('spin:landed', result);
      return result;
    } catch (error) {
      if (signal.aborted) throw error;

      if (result) {
        this.scene.executeReels(new SetReelsCommand(result.reels), signal);
        this.emitter.emit('spin:landed', result);
        return result;
      }

      try {
        await this.scene.executeReels(new LandReelsCommand(previousReels), signal);
      } catch {
        this.scene.executeReels(new SetReelsCommand(previousReels), signal);
      }
      throw error;
    }
  }

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
}
