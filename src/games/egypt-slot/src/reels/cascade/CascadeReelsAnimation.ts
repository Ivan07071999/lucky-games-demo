import type { CascadeSequence } from '@lucky-games/contracts';
import type { ReelsAnimationCue } from '../../events/GameEvents';
import type { ReelWinPresentation } from '../ReelWinPresentation';
import { ReelColumn } from '../classic/ReelColumn';
import type { ReelsMatrix } from '../reelsConfig';
import { CascadeColumn } from './CascadeColumn';
import { CascadeStepPlayer } from './CascadeStepPlayer';
import { reelDelay } from './cascadeTiming';

export class CascadeReelsAnimation {
  private readonly columns: ReelColumn[];
  private readonly cascadeColumns: CascadeColumn[];
  private readonly winPresentation: ReelWinPresentation;
  private readonly stepPlayer: CascadeStepPlayer;
  private readonly onAnimationCue?: (cue: ReelsAnimationCue) => void;
  private active = false;
  private quickStopped = false;
  private startTask: Promise<void> | null = null;

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
    this.active = true;
    this.quickStopped = false;
    this.columns.forEach((column, index) => {
      column.setSymbols(reels[index]);
      column.visible = false;
    });
    this.cascadeColumns.forEach((column, index) => {
      column.setValues(reels[index]);
      column.visible = true;
    });
    this.startTask = Promise.all(
      this.cascadeColumns.map((column, index) =>
        column.exit(signal, turbo, reelDelay(index, turbo)),
      ),
    ).then(() => undefined);
    void this.startTask.catch(() => undefined);
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
      this.active = true;
      this.quickStopped = false;
      this.columns.forEach((column) => (column.visible = false));
      this.cascadeColumns.forEach((column, index) => {
        column.setValues(sequence.initialReels[index]);
        column.visible = true;
      });
    }
    if (!this.active || quickStop) {
      this.quickStop(finalReels);
      return;
    }
    try {
      if (!hybrid) {
        await this.startTask;
        if (!this.active) return;
        await Promise.all(
          this.cascadeColumns.map((column, index) =>
            column.enter(sequence.initialReels[index], signal, turbo, reelDelay(index, turbo)),
          ),
        );
      }
      for (const step of sequence.steps) {
        if (!this.active) return;
        await this.stepPlayer.play(step, signal, turbo, () => this.active);
      }
    } catch (error) {
      if (!this.quickStopped || signal.aborted) throw error;
    } finally {
      if (this.active) this.finish(finalReels);
    }
  }

  quickStop(finalReels: ReelsMatrix): void {
    this.quickStopped = true;
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
    this.active = false;
    this.startTask = null;
  }

  private finish(finalReels: ReelsMatrix): void {
    const quickStopped = this.quickStopped;
    this.stop();
    this.columns.forEach((column, index) => column.setSymbols(finalReels[index]));
    if (quickStopped) this.onAnimationCue?.('cascadeLand');
  }
}
