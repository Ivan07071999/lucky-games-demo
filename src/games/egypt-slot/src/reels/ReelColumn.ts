import { Container } from 'pixi.js';
import { gsap } from 'gsap';
import { SYMBOLS } from '@lucky-games/contracts';
import { ReelSymbol } from './reelSymbol';
import { VISIBLE_ROWS, type ReelColumnSymbols } from './reelsConfig';

const STEP_SECONDS = 0.09;
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
    this.symbols = Array.from({ length: VISIBLE_ROWS + 1 }, (_, index) => {
      const symbol = new ReelSymbol(width, rowHeight, values[Math.max(0, index - 1)]);
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
    let steps = 0;
    while (!this.stopTarget || steps < MINIMUM_SPIN_STEPS) {
      if (this.cancelled) throw new Error('Reel spin cancelled');
      await this.advance(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], signal);
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

  private async advance(incoming: ReelColumnSymbols[number], signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    this.symbols[0].setValue(incoming);
    const movement = { y: 0 };
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
        y: this.rowHeight,
        duration: STEP_SECONDS,
        ease: 'none',
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

    const recycled = this.symbols.pop();
    if (!recycled) throw new Error('Reel column has no symbols');
    this.symbols.unshift(recycled);
    this.symbols.forEach((symbol, index) => {
      symbol.position.y = (index - 1) * this.rowHeight;
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
