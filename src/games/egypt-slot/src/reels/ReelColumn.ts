import { Container } from 'pixi.js';
import { gsap } from 'gsap';
import { SYMBOLS } from '@lucky-games/contracts';
import { ReelSymbol } from './reelSymbol';
import { VISIBLE_ROWS, type ReelColumnSymbols } from './reelsConfig';

const STEP_SECONDS = 0.1;
const FIRST_STEP_SECONDS = 0.14;
const ANTICIPATION_SECONDS = 0.22;
const ANTICIPATION_HOLD_SECONDS = 0.1;
const ANTICIPATION_PIXELS = 12;
const MINIMUM_SPIN_STEPS = 5;

export class ReelColumn extends Container {
  private readonly symbols: ReelSymbol[];
  private readonly rowHeight: number;
  private spinTask: Promise<void> | null = null;
  private stopTarget: ReelColumnSymbols | null = null;
  private cancelStep: ((reason: unknown) => void) | null = null;
  private cancelled = false;

  constructor(width: number, rowHeight: number, values: ReelColumnSymbols) {
    super();

    this.label = 'reel-column';
    this.rowHeight = rowHeight;
    this.symbols = Array.from({ length: VISIBLE_ROWS + 2 }, (_, index) => {
      const row = Math.min(VISIBLE_ROWS - 1, Math.max(0, index - 1));
      const symbol = new ReelSymbol(width, rowHeight, values[row]);
      symbol.position.y = (index - 1) * rowHeight;
      return symbol;
    });
    this.addChild(...this.symbols);
  }

  setSymbols(values: ReelColumnSymbols): void {
    this.cancelSpin();
    this.applySymbols(values);
  }

  private applySymbols(values: ReelColumnSymbols): void {
    this.symbols[0].setValue(values[0]);
    values.forEach((value, row) => this.symbols[row + 1].setValue(value));
    this.symbols[VISIBLE_ROWS + 1].setValue(values[VISIBLE_ROWS - 1]);
    this.symbols.forEach((symbol, index) => {
      symbol.position.y = (index - 1) * this.rowHeight;
    });
  }

  spin(signal: AbortSignal): void {
    if (this.spinTask) return;
    this.cancelled = false;
    this.stopTarget = null;
    this.spinTask = this.runSpin(signal).finally(() => {
      this.spinTask = null;
      this.stopTarget = null;
    });
    void this.spinTask.catch(() => undefined);
  }

  async land(values: ReelColumnSymbols, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    if (!this.spinTask) {
      this.setSymbols(values);
      return;
    }
    this.stopTarget = values;
    await this.spinTask;
  }

  async showWinRows(rows: readonly number[], signal: AbortSignal): Promise<void> {
    await Promise.all(rows.map((row) => this.symbols[row + 1]?.pulse(signal)));
  }

  async showWild(signal: AbortSignal): Promise<void> {
    await Promise.all(
      this.symbols.slice(1, VISIBLE_ROWS + 1).map((symbol) => symbol.emphasizeWild(signal)),
    );
  }

  private async runSpin(signal: AbortSignal): Promise<void> {
    const anticipation = Math.min(ANTICIPATION_PIXELS, this.rowHeight * 0.1);
    await this.animateOffset(0, -anticipation, ANTICIPATION_SECONDS, 'power2.out', signal);

    let steps = 0;
    while (!this.stopTarget || steps < MINIMUM_SPIN_STEPS) {
      if (this.cancelled) throw new Error('Reel spin cancelled');
      await this.advance(
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        signal,
        steps === 0 ? -anticipation : 0,
        steps === 0 ? FIRST_STEP_SECONDS : STEP_SECONDS,
        steps === 0 ? 'power2.in' : 'none',
        steps === 0 ? ANTICIPATION_HOLD_SECONDS : 0,
      );
      steps += 1;
    }
    const target = this.stopTarget;
    for (let row = VISIBLE_ROWS - 1; row >= 0; row -= 1) {
      if (this.cancelled) throw new Error('Reel spin cancelled');
      await this.advance(target[row], signal);
    }
    if (this.cancelled) throw new Error('Reel spin cancelled');
    this.applySymbols(target);
  }

  private async advance(
    incoming: ReelColumnSymbols[number],
    signal: AbortSignal,
    from = 0,
    duration = STEP_SECONDS,
    ease = 'none',
    delay = 0,
  ): Promise<void> {
    signal.throwIfAborted();
    this.symbols[0].setValue(incoming);
    await this.animateOffset(from, this.rowHeight, duration, ease, signal, delay);

    const recycled = this.symbols.pop();
    if (!recycled) throw new Error('Reel column has no symbols');
    this.symbols.unshift(recycled);
    this.symbols.forEach((symbol, index) => {
      symbol.position.y = (index - 1) * this.rowHeight;
    });
  }

  private async animateOffset(
    from: number,
    to: number,
    duration: number,
    ease: string,
    signal: AbortSignal,
    delay = 0,
  ): Promise<void> {
    signal.throwIfAborted();
    const movement = { y: from };
    await new Promise<void>((resolve, reject) => {
      let tween: gsap.core.Tween | null = null;
      let settled = false;
      const cleanup = () => {
        signal.removeEventListener('abort', onAbort);
        this.cancelStep = null;
      };
      const cancel = (reason: unknown) => {
        if (settled) return;
        settled = true;
        tween?.kill();
        cleanup();
        reject(reason);
      };
      const onAbort = () => cancel(signal.reason ?? new Error('Spin cancelled'));
      this.cancelStep = cancel;
      signal.addEventListener('abort', onAbort, { once: true });
      tween = gsap.to(movement, {
        y: to,
        duration,
        ease,
        delay,
        onUpdate: () => {
          this.symbols.forEach((symbol, index) => {
            symbol.position.y = (index - 1) * this.rowHeight + movement.y;
          });
        },
        onComplete: () => {
          settled = true;
          cleanup();
          resolve();
        },
      });
      if (signal.aborted) onAbort();
    });
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.cancelSpin();
    super.destroy(options);
  }

  private cancelSpin(): void {
    if (!this.spinTask) return;
    this.cancelled = true;
    this.cancelStep?.(new Error('Reel spin cancelled'));
  }
}
