import { Container } from 'pixi.js';
import { ReelSymbol } from '../reelSymbol';
import { VISIBLE_ROWS, type ReelColumnSymbols } from '../reelsConfig';
import { ReelColumnMotion } from './ReelColumnMotion';
import { ReelSpinSession } from './ReelSpinSession';

export class ReelColumn extends Container {
  private readonly symbols: ReelSymbol[];
  private readonly rowHeight: number;
  private readonly motion: ReelColumnMotion;
  private readonly spinSession: ReelSpinSession;

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
    this.motion = new ReelColumnMotion(this, this.symbols, rowHeight);
    this.spinSession = new ReelSpinSession(
      this.motion,
      (nextValues) => this.applySymbols(nextValues),
      rowHeight,
    );
  }

  setSymbols(values: ReelColumnSymbols): void {
    this.spinSession.cancel();
    this.applySymbols(values);
  }

  spin(signal: AbortSignal, turbo = false): void {
    this.spinSession.spin(signal, turbo);
  }

  quickLand(values: ReelColumnSymbols, signal: AbortSignal, turbo = false): void {
    this.spinSession.quickLand(values, signal, turbo);
  }

  land(values: ReelColumnSymbols, signal: AbortSignal): Promise<void> {
    return this.spinSession.land(values, signal);
  }

  settle(signal: AbortSignal): Promise<void> {
    return this.motion.settle(signal);
  }

  async showWinRows(rows: readonly number[], signal: AbortSignal): Promise<void> {
    await Promise.all(rows.map((row) => this.symbols[row + 1]?.pulse(signal)));
  }

  async showWild(signal: AbortSignal): Promise<void> {
    await Promise.all(
      this.symbols.slice(1, VISIBLE_ROWS + 1).map((symbol) => symbol.emphasizeWild(signal)),
    );
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.spinSession.cancel();
    super.destroy(options);
  }

  private applySymbols(values: ReelColumnSymbols): void {
    this.symbols[0].setValue(values[0]);
    values.forEach((value, row) => this.symbols[row + 1].setValue(value));
    this.symbols[VISIBLE_ROWS + 1].setValue(values[VISIBLE_ROWS - 1]);
    this.symbols.forEach((symbol, index) => {
      symbol.position.y = (index - 1) * this.rowHeight;
    });
  }
}
