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

interface SpinRun {
  task: Promise<void> | null;
  stopTarget: ReelColumnSymbols | null;
  cancelled: boolean;
  quickStopRequested: boolean;
}

export class ReelSpinSession {
  private readonly motion: ReelColumnMotion;
  private readonly applySymbols: (values: ReelColumnSymbols) => void;
  private readonly rowHeight: number;
  private run: SpinRun | null = null;

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
    signal.throwIfAborted();
    if (this.run) return;

    const run: SpinRun = {
      task: null,
      stopTarget: null,
      cancelled: false,
      quickStopRequested: false,
    };
    this.run = run;
    run.task = this.runSpin(run, signal, turbo).finally(() => {
      if (this.run === run) this.run = null;
    });
    void run.task.catch(() => undefined);
  }

  quickLand(values: ReelColumnSymbols, signal: AbortSignal, turbo = false): void {
    signal.throwIfAborted();
    this.spin(signal, turbo);
    const run = this.run;
    if (!run) return;
    run.stopTarget = values;
    run.quickStopRequested = true;
    this.motion.speedUp();
  }

  async land(values: ReelColumnSymbols, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    const run = this.run;
    if (!run) {
      this.cancel();
      this.applySymbols(values);
      return;
    }
    run.stopTarget = values;
    await run.task;
  }

  cancel(): void {
    if (this.run) this.run.cancelled = true;
    this.run = null;
    this.motion.cancel();
  }

  private async runSpin(run: SpinRun, signal: AbortSignal, turbo: boolean): Promise<void> {
    const anticipation = turbo ? 0 : Math.min(ANTICIPATION_PIXELS, this.rowHeight * 0.1);
    if (!turbo) {
      await this.motion.offset(0, -anticipation, signal, {
        duration: ANTICIPATION_SECONDS,
        ease: 'power2.out',
      });
    }

    let steps = 0;
    while (!run.stopTarget || (!run.quickStopRequested && steps < MINIMUM_SPIN_STEPS)) {
      if (run.cancelled) throw new Error('Reel spin cancelled');
      const firstStep = steps === 0 && !turbo;
      await this.motion.advance(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], signal, {
        from: firstStep ? -anticipation : 0,
        duration: run.quickStopRequested
          ? QUICK_STOP_STEP_SECONDS
          : firstStep
            ? FIRST_STEP_SECONDS
            : STEP_SECONDS,
        ease: firstStep ? 'power2.in' : 'none',
        delay: firstStep && !run.quickStopRequested ? ANTICIPATION_HOLD_SECONDS : 0,
      });
      steps += 1;
    }

    const target = run.stopTarget;
    if (!target || run.cancelled) throw new Error('Reel spin cancelled');
    for (let row = VISIBLE_ROWS - 1; row >= 0; row -= 1) {
      if (run.cancelled) throw new Error('Reel spin cancelled');
      await this.motion.advance(target[row], signal, {
        duration: run.quickStopRequested ? QUICK_STOP_STEP_SECONDS : STEP_SECONDS,
      });
    }
    if (run.cancelled) throw new Error('Reel spin cancelled');
    this.applySymbols(target);
  }
}
