import type { ReelAnticipationHint } from '@lucky-games/contracts';
import type { ReelsAnimationCue } from '../../events/GameEvents';
import type { ReelsMatrix } from '../reelsConfig';
import { AnticipationDelay } from './AnticipationDelay';
import type { ReelColumn } from './ReelColumn';

export class ReelLandingSequence {
  private readonly columns: ReelColumn[];
  private readonly cancelStarts: () => void;
  private readonly onReelStopped?: (index: number) => void;
  private readonly anticipation: AnticipationDelay;
  private landingSignal: AbortSignal | null = null;
  private stoppedColumns = 0;
  private quickStopRequested = false;
  private turboSpin = false;

  constructor(
    columns: ReelColumn[],
    cancelStarts: () => void,
    onReelStopped?: (index: number) => void,
    onAnimationCue?: (cue: ReelsAnimationCue) => void,
  ) {
    this.columns = columns;
    this.cancelStarts = cancelStarts;
    this.onReelStopped = onReelStopped;
    this.anticipation = new AnticipationDelay(onAnimationCue);
  }

  reset(turbo: boolean): void {
    this.landingSignal = null;
    this.stoppedColumns = 0;
    this.quickStopRequested = false;
    this.turboSpin = turbo;
  }

  async land(
    reels: ReelsMatrix,
    signal: AbortSignal,
    quickStop = false,
    anticipation: ReelAnticipationHint | null = null,
  ): Promise<void> {
    this.landingSignal = signal;
    if (quickStop) this.requestQuickStop(reels, signal);
    try {
      if (quickStop) {
        await Promise.all(this.columns.map((column, index) => column.land(reels[index], signal)));
        await Promise.all(this.columns.map((column) => column.settle(signal)));
        this.onReelStopped?.(0);
        return;
      }
      for (let index = 0; index < this.columns.length; index += 1) {
        signal.throwIfAborted();
        if (anticipation?.reelIndex === index && !this.quickStopRequested) {
          await this.anticipation.wait(anticipation.extraSpinMs, signal);
        }
        await this.columns[index].land(reels[index], signal);
        this.stoppedColumns = index + 1;
        if (this.quickStopRequested) {
          await this.finishQuickStop(reels, signal, index, index + 1);
          return;
        }
        await this.columns[index].settle(signal);
        if (this.quickStopRequested) {
          await this.finishQuickStop(reels, signal, index + 1);
          return;
        }
        this.onReelStopped?.(index);
      }
    } finally {
      this.landingSignal = null;
    }
  }

  requestQuickStop(reels: ReelsMatrix, signal: AbortSignal): void {
    if (this.landingSignal !== signal || this.quickStopRequested || signal.aborted) return;
    this.quickStopRequested = true;
    this.cancelStarts();
    this.anticipation.skip();
    this.columns.forEach((column, index) => {
      if (index >= this.stoppedColumns) column.quickLand(reels[index], signal, this.turboSpin);
    });
  }

  stop(): void {
    this.anticipation.cancel();
  }

  private async finishQuickStop(
    reels: ReelsMatrix,
    signal: AbortSignal,
    firstUnsettledIndex: number,
    firstUnlandedIndex = firstUnsettledIndex,
  ): Promise<void> {
    await Promise.all(
      this.columns
        .slice(firstUnlandedIndex)
        .map((column, offset) => column.land(reels[firstUnlandedIndex + offset], signal)),
    );
    await Promise.all(
      this.columns.slice(firstUnsettledIndex).map((column) => column.settle(signal)),
    );
    this.onReelStopped?.(0);
  }
}
