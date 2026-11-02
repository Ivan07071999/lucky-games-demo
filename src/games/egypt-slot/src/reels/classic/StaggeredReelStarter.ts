import { gsap } from 'gsap';
import type { ReelColumn } from './ReelColumn';
import { START_INTERVAL_SECONDS } from './classicTiming';

export class StaggeredReelStarter {
  private readonly columns: ReelColumn[];
  private readonly scheduledStarts = new Set<gsap.core.Tween>();
  private startSignal: AbortSignal | null = null;

  constructor(columns: ReelColumn[]) {
    this.columns = columns;
  }

  start(signal: AbortSignal, turbo: boolean): void {
    this.startSignal = signal;
    signal.addEventListener('abort', this.cancel, { once: true });

    this.columns[0].spin(signal, turbo);
    for (let index = 1; index < this.columns.length; index += 1) {
      const start = gsap.delayedCall(index * START_INTERVAL_SECONDS, () => {
        this.scheduledStarts.delete(start);
        if (!signal.aborted) this.columns[index].spin(signal, turbo);
        if (this.scheduledStarts.size === 0) this.detachSignal();
      });
      this.scheduledStarts.add(start);
    }
  }

  readonly cancel = (): void => {
    this.scheduledStarts.forEach((start) => start.kill());
    this.scheduledStarts.clear();
    this.detachSignal();
  };

  private detachSignal(): void {
    this.startSignal?.removeEventListener('abort', this.cancel);
    this.startSignal = null;
  }
}
