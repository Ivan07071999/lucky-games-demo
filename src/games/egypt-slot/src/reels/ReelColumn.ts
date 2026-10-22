import { Container } from 'pixi.js';
import { ReelSymbol } from './reelSymbol';
import { VISIBLE_ROWS, type ReelColumnSymbols } from './reelsConfig';

export class ReelColumn extends Container {
  private readonly symbols: ReelSymbol[];

  constructor(width: number, rowHeight: number, values: ReelColumnSymbols) {
    super();

    this.label = 'reel-column';
    this.symbols = Array.from({ length: VISIBLE_ROWS }, (_, row) => {
      const symbol = new ReelSymbol(width, rowHeight, values[row]);
      symbol.position.y = row * rowHeight;
      return symbol;
    });
    this.addChild(...this.symbols);
  }

  setSymbols(values: ReelColumnSymbols): void {
    this.symbols.forEach((symbol, row) => symbol.setValue(values[row]));
  }
}
