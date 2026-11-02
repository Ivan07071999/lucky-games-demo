import type { ReelAnticipationHint } from '@lucky-games/contracts';
import type { ReelsAnimationCue } from '../../events/GameEvents';
import type { ReelsMatrix } from '../reelsConfig';
import type { ReelColumn } from './ReelColumn';
import { ReelLandingSequence } from './ReelLandingSequence';
import { StaggeredReelStarter } from './StaggeredReelStarter';

export class ClassicReelsAnimation {
  private readonly starter: StaggeredReelStarter;
  private readonly landing: ReelLandingSequence;

  constructor(
    columns: ReelColumn[],
    onReelStopped?: (index: number) => void,
    onAnimationCue?: (cue: ReelsAnimationCue) => void,
  ) {
    this.starter = new StaggeredReelStarter(columns);
    this.landing = new ReelLandingSequence(
      columns,
      () => this.starter.cancel(),
      onReelStopped,
      onAnimationCue,
    );
  }

  spin(signal: AbortSignal, turbo = false): void {
    signal.throwIfAborted();
    this.starter.cancel();
    this.landing.reset(turbo);
    this.starter.start(signal, turbo);
  }

  land(
    reels: ReelsMatrix,
    signal: AbortSignal,
    quickStop = false,
    anticipation: ReelAnticipationHint | null = null,
  ): Promise<void> {
    return this.landing.land(reels, signal, quickStop, anticipation);
  }

  requestQuickStop(reels: ReelsMatrix, signal: AbortSignal): void {
    this.landing.requestQuickStop(reels, signal);
  }

  stop(): void {
    this.starter.cancel();
    this.landing.stop();
  }
}
