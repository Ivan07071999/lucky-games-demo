import type { ReelSymbol } from '../reelSymbol';
import { CancelableTimeline } from '../animation/CancelableTimeline';
import { addFall, addLanding, symbolDelay } from './cascadeMotion';

export interface CascadeRefillAnimation {
  incoming: { symbol: ReelSymbol; targetRow: number; delayOrder: number }[];
  survivors: { symbol: ReelSymbol; targetRow: number }[];
}

export class CascadeColumnAnimator {
  private readonly rowHeight: number;
  private readonly onFall?: () => void;
  private readonly onLand?: () => void;
  private readonly timeline = new CancelableTimeline('Cascade animation cancelled');

  constructor(rowHeight: number, onFall?: () => void, onLand?: () => void) {
    this.rowHeight = rowHeight;
    this.onFall = onFall;
    this.onLand = onLand;
  }

  exit(
    symbols: readonly ReelSymbol[],
    signal: AbortSignal,
    turbo: boolean,
    startDelay = 0,
  ): Promise<void> {
    return this.timeline.run(signal, (timeline) => {
      symbols.forEach((symbol, row) => {
        addFall(timeline, symbol, {
          targetRow: row + 3,
          rowHeight: this.rowHeight,
          startDelay: startDelay + symbolDelay(symbols.length - 1 - row, turbo),
          duration: turbo ? 0.12 : 0.32,
          onFall: this.onFall,
        });
      });
    });
  }

  enter(
    symbols: readonly ReelSymbol[],
    signal: AbortSignal,
    turbo: boolean,
    startDelay = 0,
  ): Promise<void> {
    return this.timeline.run(signal, (timeline) => {
      symbols.forEach((symbol, row) => {
        addLanding(timeline, symbol, {
          targetRow: row,
          rowHeight: this.rowHeight,
          startDelay: startDelay + symbolDelay(symbols.length - 1 - row, turbo),
          turbo,
          onLand: this.onLand,
        });
      });
    });
  }

  removeRows(
    symbols: readonly ReelSymbol[],
    totalRows: number,
    signal: AbortSignal,
    turbo: boolean,
    startDelay = 0,
  ): Promise<void> {
    return this.timeline.run(signal, (timeline) => {
      symbols.forEach((symbol, index) => {
        addFall(timeline, symbol, {
          targetRow: totalRows + index,
          rowHeight: this.rowHeight,
          startDelay: startDelay + symbolDelay(symbols.length - 1 - index, turbo),
          duration: turbo ? 0.12 : 0.3,
          onFall: this.onFall,
        });
      });
    });
  }

  refill(
    plan: CascadeRefillAnimation,
    signal: AbortSignal,
    turbo: boolean,
    startDelay = 0,
  ): Promise<void> {
    return this.timeline.run(signal, (timeline) => {
      plan.survivors.forEach(({ symbol, targetRow }) => {
        addLanding(timeline, symbol, {
          targetRow,
          rowHeight: this.rowHeight,
          startDelay,
          turbo,
        });
      });
      plan.incoming.forEach(({ symbol, targetRow, delayOrder }) => {
        addLanding(timeline, symbol, {
          targetRow,
          rowHeight: this.rowHeight,
          startDelay: startDelay + symbolDelay(delayOrder, turbo),
          turbo,
          onLand: this.onLand,
        });
      });
    });
  }

  cancel(): void {
    this.timeline.cancel();
  }
}
