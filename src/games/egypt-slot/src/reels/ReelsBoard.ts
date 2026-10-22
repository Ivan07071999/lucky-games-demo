import { Container, Graphics } from 'pixi.js';
import { ReelColumn } from './ReelColumn';
import { INITIAL_REELS, REEL_COUNT, VISIBLE_ROWS, type ReelsMatrix } from './reelsConfig';

export class ReelsBoard extends Container {
  private readonly columns: ReelColumn[];

  constructor(width: number, height: number) {
    super();

    this.label = 'reels-board';
    const columnWidth = width / REEL_COUNT;
    const rowHeight = height / VISIBLE_ROWS;
    this.columns = INITIAL_REELS.map((values, index) => {
      const column = new ReelColumn(columnWidth, rowHeight, values);
      column.position.x = index * columnWidth;
      column.label = `reel-${index + 1}`;
      return column;
    });

    const mask = new Graphics().roundRect(0, 0, width, height, 12).fill(0xffffff);
    this.addChild(...this.columns, mask);
    this.mask = mask;
  }

  setSymbols(reels: ReelsMatrix): void {
    if (reels.length !== REEL_COUNT || reels.some((reel) => reel.length !== VISIBLE_ROWS)) {
      throw new Error(`Expected ${REEL_COUNT} reels with ${VISIBLE_ROWS} symbols each`);
    }

    this.columns.forEach((column, index) => column.setSymbols(reels[index]));
  }
}
