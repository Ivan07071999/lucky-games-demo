import { gsap } from 'gsap';
import { Container } from 'pixi.js';
import { ReelSymbol } from './reelSymbol';
import type { ReelColumnSymbols } from './reelsConfig';

export class CascadeColumn extends Container {
  private symbols: ReelSymbol[];
  private readonly rowHeight: number;
  private cancelAnimation: (() => void) | null = null;

  constructor(width: number, rowHeight: number, values: ReelColumnSymbols) {
    super();
    this.rowHeight = rowHeight;
    this.symbols = values.map((value, row) => {
      const symbol = new ReelSymbol(width, rowHeight, value);
      symbol.y = row * rowHeight;
      return symbol;
    });
    this.addChild(...this.symbols);
  }

  setValues(values: ReelColumnSymbols): void {
    this.cancel();
    this.symbols.forEach((symbol, row) => {
      symbol.setValue(values[row]);
      symbol.y = row * this.rowHeight;
      symbol.alpha = 1;
    });
  }

  exit(signal: AbortSignal, turbo: boolean): Promise<void> {
    return this.animate(signal, (timeline) => {
      this.symbols.forEach((symbol, row) => {
        timeline.to(
          symbol,
          {
            y: (row + 3) * this.rowHeight,
            alpha: 0,
            duration: turbo ? 0.12 : 0.32,
            ease: 'power2.in',
          },
          row * (turbo ? 0.01 : 0.035),
        );
      });
    });
  }

  enter(values: ReelColumnSymbols, signal: AbortSignal, turbo: boolean): Promise<void> {
    this.symbols.forEach((symbol, row) => {
      symbol.setValue(values[row]);
      symbol.y = (row - 3) * this.rowHeight;
      symbol.alpha = 1;
    });
    return this.animate(signal, (timeline) => {
      this.symbols.forEach((symbol, row) => {
        timeline.to(
          symbol,
          { y: row * this.rowHeight, duration: turbo ? 0.14 : 0.4, ease: 'power2.out' },
          row * (turbo ? 0.015 : 0.065),
        );
      });
    });
  }

  refill(
    removedRows: readonly number[],
    values: ReelColumnSymbols,
    signal: AbortSignal,
    turbo: boolean,
  ): Promise<void> {
    if (removedRows.length === 0) return Promise.resolve();
    const removed = new Set(removedRows);
    const incoming = this.symbols.filter((_, row) => removed.has(row));
    const survivors = this.symbols.filter((_, row) => !removed.has(row));
    const fade = turbo ? 0.06 : 0.18;
    const fall = turbo ? 0.13 : 0.36;

    return this.animate(signal, (timeline) => {
      for (const symbol of incoming) timeline.to(symbol, { alpha: 0, duration: fade }, 0);
      timeline.call(
        () => {
          incoming.forEach((symbol, row) => {
            symbol.setValue(values[row]);
            symbol.y = (row - incoming.length) * this.rowHeight;
          });
          survivors.forEach((symbol, index) => {
            symbol.setValue(values[incoming.length + index]);
          });
        },
        [],
        fade,
      );
      survivors.forEach((symbol, index) => {
        timeline.to(
          symbol,
          {
            y: (incoming.length + index) * this.rowHeight,
            duration: fall,
            ease: 'power2.out',
          },
          fade,
        );
      });
      incoming.forEach((symbol, row) => {
        timeline.to(
          symbol,
          { y: row * this.rowHeight, alpha: 1, duration: fall, ease: 'power2.out' },
          fade,
        );
      });
    }).then(() => {
      this.symbols = [...incoming, ...survivors];
      this.setValues(values);
    });
  }

  cancel(): void {
    this.cancelAnimation?.();
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.cancel();
    super.destroy(options);
  }

  private animate(
    signal: AbortSignal,
    build: (timeline: gsap.core.Timeline) => void,
  ): Promise<void> {
    signal.throwIfAborted();
    this.cancel();
    return new Promise<void>((resolve, reject) => {
      const timeline = gsap.timeline({ paused: true });
      const cleanup = (): void => {
        signal.removeEventListener('abort', onAbort);
        this.cancelAnimation = null;
      };
      const onAbort = (): void => {
        timeline.kill();
        cleanup();
        reject(signal.reason ?? new Error('Cascade animation cancelled'));
      };
      this.cancelAnimation = onAbort;
      signal.addEventListener('abort', onAbort, { once: true });
      build(timeline);
      timeline.eventCallback('onComplete', () => {
        cleanup();
        resolve();
      });
      timeline.play();
      if (signal.aborted) onAbort();
    });
  }
}
