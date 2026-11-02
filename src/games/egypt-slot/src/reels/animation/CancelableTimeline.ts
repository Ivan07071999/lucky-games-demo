import { gsap } from 'gsap';

export class CancelableTimeline {
  private readonly cancellationMessage: string;
  private cancelAnimation: (() => void) | null = null;

  constructor(cancellationMessage: string) {
    this.cancellationMessage = cancellationMessage;
  }

  run(signal: AbortSignal, build: (timeline: gsap.core.Timeline) => void): Promise<void> {
    signal.throwIfAborted();
    this.cancel();

    return new Promise<void>((resolve, reject) => {
      const timeline = gsap.timeline({ paused: true });
      let settled = false;

      const cleanup = (): void => {
        signal.removeEventListener('abort', onAbort);
        this.cancelAnimation = null;
      };
      const fail = (reason: unknown): void => {
        if (settled) return;
        settled = true;
        timeline.kill();
        cleanup();
        reject(reason);
      };
      const onAbort = (): void => {
        fail(signal.reason ?? new Error(this.cancellationMessage));
      };

      this.cancelAnimation = onAbort;
      signal.addEventListener('abort', onAbort, { once: true });
      try {
        build(timeline);
      } catch (error) {
        fail(error);
        return;
      }

      timeline.eventCallback('onComplete', () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      });
      timeline.play();
      if (signal.aborted) onAbort();
    });
  }

  cancel(): void {
    this.cancelAnimation?.();
  }
}
