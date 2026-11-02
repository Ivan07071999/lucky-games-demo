import type { CascadeSequence } from '@lucky-games/contracts';
import type { ReelsAnimationCue } from '../../events/GameEvents';
import type { ReelWinPresentation } from '../ReelWinPresentation';
import { ReelColumn } from '../classic/ReelColumn';
import type { ReelsMatrix } from '../reelsConfig';
import { CascadeColumn } from './CascadeColumn';
import { CascadeStepPlayer } from './CascadeStepPlayer';
import { reelDelay } from './cascadeTiming';

interface CascadePlayback {
  quickStopped: boolean;
  startTask: Promise<void> | null;
}

export class CascadeReelsAnimation {
  private readonly columns: ReelColumn[];
  private readonly cascadeColumns: CascadeColumn[];
  private readonly winPresentation: ReelWinPresentation;
  private readonly stepPlayer: CascadeStepPlayer;
  private readonly onAnimationCue?: (cue: ReelsAnimationCue) => void;
  private playback: CascadePlayback | null = null;

  constructor(
    columns: ReelColumn[],
    cascadeColumns: CascadeColumn[],
    winPresentation: ReelWinPresentation,
    onAnimationCue?: (cue: ReelsAnimationCue) => void,
  ) {
    this.columns = columns;
    this.cascadeColumns = cascadeColumns;
    this.winPresentation = winPresentation;
    this.stepPlayer = new CascadeStepPlayer(cascadeColumns, winPresentation);
    this.onAnimationCue = onAnimationCue;
  }

  start(reels: ReelsMatrix, signal: AbortSignal, turbo = false): void {
    signal.throwIfAborted();
    this.stop();
    const playback: CascadePlayback = { quickStopped: false, startTask: null };
    this.playback = playback;
    this.columns.forEach((column, index) => {
      column.setSymbols(reels[index]);
      column.visible = false;
    });
    this.cascadeColumns.forEach((column, index) => {
      column.setValues(reels[index]);
      column.visible = true;
    });
    playback.startTask = Promise.all(
      this.cascadeColumns.map((column, index) =>
        column.exit(signal, turbo, reelDelay(index, turbo)),
      ),
    ).then(() => undefined);
    void playback.startTask.catch(() => undefined);
  }

  async play(
    sequence: CascadeSequence,
    finalReels: ReelsMatrix,
    signal: AbortSignal,
    turbo = false,
    quickStop = false,
    hybrid = false,
  ): Promise<void> {
    signal.throwIfAborted();
    if (hybrid && !quickStop) {
      this.stop();
      this.playback = { quickStopped: false, startTask: null };
      this.columns.forEach((column) => (column.visible = false));
      this.cascadeColumns.forEach((column, index) => {
        column.setValues(sequence.initialReels[index]);
        column.visible = true;
      });
    }
    const playback = this.playback;
    if (!playback || quickStop) {
      this.quickStop(finalReels);
      return;
    }
    try {
      if (!hybrid) {
        await playback.startTask;
        if (this.playback !== playback) return;
        await Promise.all(
          this.cascadeColumns.map((column, index) =>
            column.enter(sequence.initialReels[index], signal, turbo, reelDelay(index, turbo)),
          ),
        );
      }
      for (const step of sequence.steps) {
        if (this.playback !== playback) return;
        await this.stepPlayer.play(step, signal, turbo, () => this.playback === playback);
      }
    } catch (error) {
      if (!playback.quickStopped || signal.aborted) throw error;
    } finally {
      if (this.playback === playback) this.finish(finalReels);
    }
  }

  quickStop(finalReels: ReelsMatrix): void {
    if (this.playback) this.playback.quickStopped = true;
    this.finish(finalReels);
  }

  stop(): void {
    this.stepPlayer.cancel();
    this.cascadeColumns.forEach((column) => {
      column.cancel();
      column.visible = false;
    });
    this.columns.forEach((column) => (column.visible = true));
    this.winPresentation.clearLine();
    this.playback = null;
  }

  private finish(finalReels: ReelsMatrix): void {
    const quickStopped = this.playback?.quickStopped ?? false;
    this.stop();
    this.columns.forEach((column, index) => column.setSymbols(finalReels[index]));
    if (quickStopped) this.onAnimationCue?.('cascadeLand');
  }
}
