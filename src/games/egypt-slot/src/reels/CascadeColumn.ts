import { gsap } from 'gsap';
import { Container } from 'pixi.js';
import { ReelSymbol } from './reelSymbol';
import type { ReelColumnSymbols } from './reelsConfig';

const SYMBOL_INTERVAL_SECONDS = 0.11;
const TURBO_SYMBOL_INTERVAL_SECONDS = 0.025;

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

  exit(signal: AbortSignal, turbo: boolean, startDelay = 0): Promise<void> {
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
          startDelay + this.symbolDelay(this.symbols.length - 1 - row, turbo),
        );
      });
    });
  }

  enter(
    values: ReelColumnSymbols,
    signal: AbortSignal,
    turbo: boolean,
    startDelay = 0,
  ): Promise<void> {
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
          startDelay + this.symbolDelay(this.symbols.length - 1 - row, turbo),
        );
      });
    });
  }

  removeRows(
    removedRows: readonly number[],
    signal: AbortSignal,
    turbo: boolean,
    startDelay = 0,
  ): Promise<void> {
    if (removedRows.length === 0) return Promise.resolve();
    const removed = new Set(removedRows);
    const incoming = this.symbols.filter((_, row) => removed.has(row));

    return this.animate(signal, (timeline) => {
      incoming.forEach((symbol, index) => {
        timeline.to(
          symbol,
          {
            y: (this.symbols.length + index) * this.rowHeight,
            alpha: 0,
            duration: turbo ? 0.12 : 0.3,
            ease: 'power2.in',
          },
          startDelay + this.symbolDelay(incoming.length - 1 - index, turbo),
        );
      });
    });
  }

  refill(
    removedRows: readonly number[],
    values: ReelColumnSymbols,
    signal: AbortSignal,
    turbo: boolean,
    startDelay = 0,
  ): Promise<void> {
    if (removedRows.length === 0) return Promise.resolve();
    const removed = new Set(removedRows);
    const incoming = this.symbols.filter((_, row) => removed.has(row));
    const survivors = this.symbols.filter((_, row) => !removed.has(row));
    const fall = turbo ? 0.14 : 0.4;

    incoming.forEach((symbol, row) => {
      symbol.setValue(values[row]);
      symbol.y = (row - incoming.length) * this.rowHeight;
      symbol.alpha = 1;
    });
    survivors.forEach((symbol, index) => {
      symbol.setValue(values[incoming.length + index]);
    });

    return this.animate(signal, (timeline) => {
      survivors.forEach((symbol, index) => {
        timeline.to(
          symbol,
          {
            y: (incoming.length + index) * this.rowHeight,
            duration: fall,
            ease: 'power2.out',
          },
          startDelay,
        );
      });
      incoming.forEach((symbol, row) => {
        timeline.to(
          symbol,
          { y: row * this.rowHeight, duration: fall, ease: 'power2.out' },
          startDelay + this.symbolDelay(incoming.length - 1 - row, turbo),
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

  private symbolDelay(order: number, turbo: boolean): number {
    return order * (turbo ? TURBO_SYMBOL_INTERVAL_SECONDS : SYMBOL_INTERVAL_SECONDS);
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
