import { Container } from 'pixi.js';
import { ReelSymbol } from '../reelSymbol';
import type { ReelColumnSymbols } from '../reelsConfig';
import { CascadeColumnAnimator, type CascadeRefillAnimation } from './CascadeColumnAnimator';
import { partitionCascadeRows, planCascadeRefill } from './cascadeRefill';

export class CascadeColumn extends Container {
  private symbols: ReelSymbol[];
  private readonly rowHeight: number;
  private readonly animator: CascadeColumnAnimator;
  private revision = 0;

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
    const { removed } = partitionCascadeRows(this.symbols.length, removedRows);
    const symbols = removed.map((row) => this.symbols[row]);
    return this.animator.removeRows(symbols, this.symbols.length, signal, turbo, startDelay);
  }

  refill(
    removedRows: readonly number[],
    values: ReelColumnSymbols,
    signal: AbortSignal,
    turbo: boolean,
    startDelay = 0,
  ): Promise<void> {
    if (removedRows.length === 0) return Promise.resolve();
    const plan = planCascadeRefill(this.symbols.length, removedRows, values);
    const symbols = this.symbols;
    const revision = this.revision;

    plan.incoming.forEach(({ sourceRow, value, startRow }) => {
      const symbol = symbols[sourceRow];
      symbol.setValue(value);
      symbol.y = startRow * this.rowHeight;
      symbol.alpha = 1;
    });
    plan.survivors.forEach(({ sourceRow, value }) => {
      symbols[sourceRow].setValue(value);
    });

    const animation: CascadeRefillAnimation = {
      incoming: plan.incoming.map(({ sourceRow, targetRow, delayOrder }) => ({
        symbol: symbols[sourceRow],
        targetRow,
        delayOrder,
      })),
      survivors: plan.survivors.map(({ sourceRow, targetRow }) => ({
        symbol: symbols[sourceRow],
        targetRow,
      })),
    };

    return this.animator.refill(animation, signal, turbo, startDelay).then(() => {
      if (revision !== this.revision) return;
      this.symbols = plan.finalSourceRows.map((row) => symbols[row]);
      this.setValues(values);
    });
  }

  cancel(): void {
    this.revision += 1;
    this.animator.cancel();
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.cancel();
    super.destroy(options);
  }
}
