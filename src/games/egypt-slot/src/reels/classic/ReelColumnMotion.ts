import { gsap } from 'gsap';
import type { Container } from 'pixi.js';
import type { ReelSymbol } from '../reelSymbol';
import type { ReelColumnSymbols } from '../reelsConfig';
import {
  QUICK_STOP_TWEEN_SPEED,
  SETTLE_DOWN_SECONDS,
  SETTLE_PIXELS,
  SETTLE_RETURN_SECONDS,
  STEP_SECONDS,
} from './classicTiming';

interface StepMotion {
  from?: number;
  duration?: number;
  ease?: string;
  delay?: number;
}

export class ReelColumnMotion {
  private readonly column: Container;
  private readonly symbols: ReelSymbol[];
  private readonly rowHeight: number;
  private activeTween: gsap.core.Tween | null = null;
  private cancelStep: ((reason: unknown) => void) | null = null;
  private cancelSettle: ((reason: unknown) => void) | null = null;

  constructor(column: Container, symbols: ReelSymbol[], rowHeight: number) {
    this.column = column;
    this.symbols = symbols;
    this.rowHeight = rowHeight;
  }

  async advance(
    incoming: ReelColumnSymbols[number],
    signal: AbortSignal,
    options: StepMotion = {},
  ): Promise<void> {
    signal.throwIfAborted();
    this.symbols[0].setValue(incoming);
    await this.offset(options.from ?? 0, this.rowHeight, signal, options);

    const recycled = this.symbols.pop();
    if (!recycled) throw new Error('Reel column has no symbols');
    this.symbols.unshift(recycled);
    this.symbols.forEach((symbol, index) => {
      symbol.position.y = (index - 1) * this.rowHeight;
    });
  }

  async offset(from: number, to: number, signal: AbortSignal, options: StepMotion): Promise<void> {
    signal.throwIfAborted();
    const movement = { y: from };
    await new Promise<void>((resolve, reject) => {
      let tween: gsap.core.Tween | null = null;
      let settled = false;
      const cleanup = (): void => {
        signal.removeEventListener('abort', onAbort);
        this.cancelStep = null;
        if (this.activeTween === tween) this.activeTween = null;
      };
      const cancel = (reason: unknown): void => {
        if (settled) return;
        settled = true;
        tween?.kill();
        cleanup();
        reject(reason);
      };
      const onAbort = (): void => cancel(signal.reason ?? new Error('Spin cancelled'));
      this.cancelStep = cancel;
      signal.addEventListener('abort', onAbort, { once: true });
      tween = gsap.to(movement, {
        y: to,
        duration: options.duration ?? STEP_SECONDS,
        ease: options.ease ?? 'none',
        delay: options.delay ?? 0,
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
      this.activeTween = tween;
      if (signal.aborted) onAbort();
    });
  }

  settle(signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const offset = Math.min(SETTLE_PIXELS, this.rowHeight * 0.06);
      const cleanup = (): void => {
        signal.removeEventListener('abort', onAbort);
        this.cancelSettle = null;
        this.column.position.y = 0;
      };
      const cancel = (reason: unknown): void => {
        if (settled) return;
        settled = true;
        timeline.kill();
        cleanup();
        reject(reason);
      };
      const onAbort = (): void => cancel(signal.reason ?? new Error('Reel settle cancelled'));
      const timeline = gsap
        .timeline({
          onComplete: () => {
            settled = true;
            cleanup();
            resolve();
          },
        })
        .to(this.column.position, { y: offset, duration: SETTLE_DOWN_SECONDS, ease: 'power2.out' })
        .to(this.column.position, {
          y: 0,
          duration: SETTLE_RETURN_SECONDS,
          ease: 'power2.inOut',
        });
      this.cancelSettle = cancel;
      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted) onAbort();
    });
  }

  speedUp(): void {
    this.activeTween?.timeScale(QUICK_STOP_TWEEN_SPEED);
  }

  cancel(): void {
    this.cancelSettle?.(new Error('Reel settle cancelled'));
    this.cancelStep?.(new Error('Reel spin cancelled'));
  }
}
