import { Container, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import type { Win } from '@lucky-games/contracts';
import { ReelColumn } from './ReelColumn';
import { REEL_COUNT, VISIBLE_ROWS, type ReelsMatrix } from './reelsConfig';
import { WinLineOverlay } from './WinLineOverlay';

const START_INTERVAL_SECONDS = 0.09;

export class ReelsBoard extends Container {
  private readonly columns: ReelColumn[];
  private readonly winLine: WinLineOverlay;
  private readonly scheduledStarts = new Set<gsap.core.Tween>();
  private startSignal: AbortSignal | null = null;

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

    this.cancelScheduledStarts();
    this.columns.forEach((column, index) => column.setSymbols(reels[index]));
  }

  spin(signal: AbortSignal): void {
    signal.throwIfAborted();
    this.cancelScheduledStarts();
    this.startSignal = signal;
    signal.addEventListener('abort', this.cancelScheduledStarts, { once: true });

    this.columns[0].spin(signal);
    for (let index = 1; index < this.columns.length; index += 1) {
      const start = gsap.delayedCall(index * START_INTERVAL_SECONDS, () => {
        this.scheduledStarts.delete(start);
        if (!signal.aborted) this.columns[index].spin(signal);
        if (this.scheduledStarts.size === 0) this.detachStartSignal();
      });
      this.scheduledStarts.add(start);
    }
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

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.cancelScheduledStarts();
    super.destroy(options);
  }

  private readonly cancelScheduledStarts = (): void => {
    this.scheduledStarts.forEach((start) => start.kill());
    this.scheduledStarts.clear();
    this.detachStartSignal();
  };

  private detachStartSignal(): void {
    this.startSignal?.removeEventListener('abort', this.cancelScheduledStarts);
    this.startSignal = null;
  }
}
