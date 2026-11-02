import { SYMBOLS } from '@lucky-games/contracts';
import { VISIBLE_ROWS, type ReelColumnSymbols } from '../reelsConfig';
import { ReelColumnMotion } from './ReelColumnMotion';
import {
  ANTICIPATION_HOLD_SECONDS,
  ANTICIPATION_PIXELS,
  ANTICIPATION_SECONDS,
  FIRST_STEP_SECONDS,
  MINIMUM_SPIN_STEPS,
  QUICK_STOP_STEP_SECONDS,
  STEP_SECONDS,
} from './classicTiming';

export class ReelSpinSession {
  private readonly motion: ReelColumnMotion;
  private readonly applySymbols: (values: ReelColumnSymbols) => void;
  private readonly rowHeight: number;
  private spinTask: Promise<void> | null = null;
  private stopTarget: ReelColumnSymbols | null = null;
  private cancelled = false;
  private quickStopRequested = false;

  constructor(
    motion: ReelColumnMotion,
    applySymbols: (values: ReelColumnSymbols) => void,
    rowHeight: number,
  ) {
    this.motion = motion;
    this.applySymbols = applySymbols;
    this.rowHeight = rowHeight;
  }

  spin(signal: AbortSignal, turbo = false): void {
    if (this.spinTask) return;
    this.cancelled = false;
    this.quickStopRequested = false;
    this.stopTarget = null;
    this.spinTask = this.runSpin(signal, turbo).finally(() => {
      this.spinTask = null;
      this.stopTarget = null;
    });
    void this.spinTask.catch(() => undefined);
  }

  quickLand(values: ReelColumnSymbols, signal: AbortSignal, turbo = false): void {
    signal.throwIfAborted();
    this.spin(signal, turbo);
    this.stopTarget = values;
    this.quickStopRequested = true;
    this.motion.speedUp();
  }

  async land(values: ReelColumnSymbols, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    if (!this.spinTask) {
      this.cancel();
      this.applySymbols(values);
      return;
    }
    this.stopTarget = values;
    await this.spinTask;
  }

  cancel(): void {
    if (this.spinTask) this.cancelled = true;
    this.motion.cancel();
  }

  private async runSpin(signal: AbortSignal, turbo: boolean): Promise<void> {
    const anticipation = turbo ? 0 : Math.min(ANTICIPATION_PIXELS, this.rowHeight * 0.1);
    if (!turbo) {
      await this.motion.offset(0, -anticipation, signal, {
        duration: ANTICIPATION_SECONDS,
        ease: 'power2.out',
      });
    }

    let steps = 0;
    while (!this.stopTarget || (!this.quickStopRequested && steps < MINIMUM_SPIN_STEPS)) {
      if (this.cancelled) throw new Error('Reel spin cancelled');
      const firstStep = steps === 0 && !turbo;
      await this.motion.advance(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], signal, {
        from: firstStep ? -anticipation : 0,
        duration: this.quickStopRequested
          ? QUICK_STOP_STEP_SECONDS
          : firstStep
            ? FIRST_STEP_SECONDS
            : STEP_SECONDS,
        ease: firstStep ? 'power2.in' : 'none',
        delay: firstStep && !this.quickStopRequested ? ANTICIPATION_HOLD_SECONDS : 0,
      });
      steps += 1;
    }

    const target = this.stopTarget;
    for (let row = VISIBLE_ROWS - 1; row >= 0; row -= 1) {
      if (this.cancelled) throw new Error('Reel spin cancelled');
      await this.motion.advance(target[row], signal, {
        duration: this.quickStopRequested ? QUICK_STOP_STEP_SECONDS : STEP_SECONDS,
      });
    }
    if (this.cancelled) throw new Error('Reel spin cancelled');
    this.applySymbols(target);
  }
}
