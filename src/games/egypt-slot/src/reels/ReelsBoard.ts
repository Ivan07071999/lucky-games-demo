import { Container, Graphics } from 'pixi.js';
import type { Win } from '@lucky-games/contracts';
import { ReelColumn } from './ReelColumn';
import { REEL_COUNT, VISIBLE_ROWS, type ReelsMatrix } from './reelsConfig';
import { WinLineOverlay } from './WinLineOverlay';

export class ReelsBoard extends Container {
  private readonly columns: ReelColumn[];
  private readonly winLine: WinLineOverlay;

  constructor(width: number, height: number, initialReels: ReelsMatrix) {
    super();

    this.label = 'reels-board';
    const columnWidth = width / REEL_COUNT;
    const rowHeight = height / VISIBLE_ROWS;
    this.columns = initialReels.map((values, index) => {
      const column = new ReelColumn(columnWidth, rowHeight, values);
      column.position.x = index * columnWidth;
      column.label = `reel-${index + 1}`;
      return column;
    });

    this.winLine = new WinLineOverlay(columnWidth, rowHeight);
    const mask = new Graphics().roundRect(0, 0, width, height, 12).fill(0xffffff);
    this.addChild(...this.columns, this.winLine, mask);
    this.mask = mask;
  }

  setSymbols(reels: ReelsMatrix): void {
    if (reels.length !== REEL_COUNT || reels.some((reel) => reel.length !== VISIBLE_ROWS)) {
      throw new Error(`Expected ${REEL_COUNT} reels with ${VISIBLE_ROWS} symbols each`);
    }

    this.columns.forEach((column, index) => column.setSymbols(reels[index]));
  }

  spin(signal: AbortSignal): void {
    this.columns.forEach((column) => column.spin(signal));
  }

  async land(reels: ReelsMatrix, signal: AbortSignal): Promise<void> {
    if (reels.length !== REEL_COUNT || reels.some((reel) => reel.length !== VISIBLE_ROWS)) {
      throw new Error(`Expected ${REEL_COUNT} reels with ${VISIBLE_ROWS} symbols each`);
    }
    for (let index = 0; index < this.columns.length; index += 1) {
      signal.throwIfAborted();
      await this.columns[index].land(reels[index], signal);
    }
  }

  async showWins(wins: readonly Win[], signal: AbortSignal): Promise<void> {
    try {
      for (const win of wins) {
        signal.throwIfAborted();
        this.winLine.show(win);
        const rows = this.columns.map(() => new Set<number>());
        win.positions.forEach(([reelIndex, rowIndex]) => rows[reelIndex]?.add(rowIndex));
        await Promise.all(
          this.columns.map((column, index) => column.showWinRows([...rows[index]], signal)),
        );
      }
    } finally {
      this.winLine.clear();
    }
  }

  async showWild(expandedReels: readonly number[], signal: AbortSignal): Promise<void> {
    for (const reelIndex of expandedReels) {
      signal.throwIfAborted();
      await this.columns[reelIndex]?.showWild(signal);
    }
  }
}
