import { Container } from 'pixi.js';
import { ReelSymbol } from '../reelSymbol';
import type { ReelColumnSymbols } from '../reelsConfig';
import { CascadeColumnAnimator } from './CascadeColumnAnimator';
import { partitionCascadeSymbols, planCascadeRefill } from './cascadeRefill';

export class CascadeColumn extends Container {
  private symbols: ReelSymbol[];
  private readonly rowHeight: number;
  private readonly animator: CascadeColumnAnimator;

  constructor(
    width: number,
    rowHeight: number,
    values: ReelColumnSymbols,
    onFall?: () => void,
    onLand?: () => void,
  ) {
    super();
    this.rowHeight = rowHeight;
    this.animator = new CascadeColumnAnimator(rowHeight, onFall, onLand);
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

  async showWinRows(rows: readonly number[], signal: AbortSignal): Promise<void> {
    await Promise.all(rows.map((row) => this.symbols[row]?.pulse(signal)));
  }

  exit(signal: AbortSignal, turbo: boolean, startDelay = 0): Promise<void> {
    return this.animator.exit(this.symbols, signal, turbo, startDelay);
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
    return this.animator.enter(this.symbols, signal, turbo, startDelay);
  }

  removeRows(
    removedRows: readonly number[],
    signal: AbortSignal,
    turbo: boolean,
    startDelay = 0,
  ): Promise<void> {
    if (removedRows.length === 0) return Promise.resolve();
    const { incoming } = partitionCascadeSymbols(this.symbols, removedRows);
    return this.animator.removeRows(incoming, this.symbols.length, signal, turbo, startDelay);
  }

  refill(
    removedRows: readonly number[],
    values: ReelColumnSymbols,
    signal: AbortSignal,
    turbo: boolean,
    startDelay = 0,
  ): Promise<void> {
    if (removedRows.length === 0) return Promise.resolve();
    const plan = planCascadeRefill(this.symbols, removedRows, values);

    plan.incoming.forEach(({ symbol, value, startRow }) => {
      symbol.setValue(value);
      symbol.y = startRow * this.rowHeight;
      symbol.alpha = 1;
    });
    plan.survivors.forEach(({ symbol, value }) => {
      symbol.setValue(value);
    });

    return this.animator.refill(plan, signal, turbo, startDelay).then(() => {
      this.symbols = plan.finalSymbols;
      this.setValues(values);
    });
  }

  cancel(): void {
    this.animator.cancel();
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.cancel();
    super.destroy(options);
  }
}
