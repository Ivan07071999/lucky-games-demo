import { gsap } from 'gsap';
import type { ReelsAnimationCue } from '../../events/GameEvents';

export class AnticipationDelay {
  private readonly onAnimationCue?: (cue: ReelsAnimationCue) => void;
  private skipWait: (() => void) | null = null;
  private cancelWait: (() => void) | null = null;

  constructor(onAnimationCue?: (cue: ReelsAnimationCue) => void) {
    this.onAnimationCue = onAnimationCue;
  }

  wait(extraSpinMs: number, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    if (extraSpinMs <= 0) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      let settled = false;
      let cueStarted = false;
      let delay: gsap.core.Tween | null = null;
      const cleanup = (): void => {
        signal.removeEventListener('abort', onAbort);
        this.skipWait = null;
        this.cancelWait = null;
        if (cueStarted) {
          cueStarted = false;
          this.onAnimationCue?.('anticipationEnd');
        }
      };
      const finish = (): void => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };
      const onAbort = (): void => {
        if (settled) return;
        settled = true;
        delay?.kill();
        cleanup();
        reject(signal.reason ?? new Error('Reel anticipation cancelled'));
      };
      this.skipWait = () => {
        delay?.kill();
        finish();
      };
      this.cancelWait = onAbort;
      signal.addEventListener('abort', onAbort, { once: true });
      delay = gsap.delayedCall(extraSpinMs / 1000, finish);
      if (signal.aborted) onAbort();
      else {
        cueStarted = true;
        this.onAnimationCue?.('anticipationStart');
      }
    });
  }

  skip(): void {
    this.skipWait?.();
  }

  cancel(): void {
    this.cancelWait?.();
  }
}
