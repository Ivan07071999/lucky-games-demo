import { Container, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import type { Win } from '@lucky-games/contracts';
import { ReelColumn } from './ReelColumn';
import { FreeSpinsTriggerOverlay } from './FreeSpinsTriggerOverlay';
import { REEL_COUNT, VISIBLE_ROWS, type ReelsMatrix } from './reelsConfig';
import { WinLineOverlay } from './WinLineOverlay';

const START_INTERVAL_SECONDS = 0.09;

export class ReelsBoard extends Container {
  private readonly columns: ReelColumn[];
  private readonly winLine: WinLineOverlay;
  private readonly freeSpinsTrigger: FreeSpinsTriggerOverlay;
  private readonly onReelStopped?: (index: number) => void;
  private readonly scheduledStarts = new Set<gsap.core.Tween>();
  private startSignal: AbortSignal | null = null;
  private landingSignal: AbortSignal | null = null;
  private stoppedColumns = 0;
  private quickStopRequested = false;
  private turboSpin = false;

  constructor(
    width: number,
    height: number,
    initialReels: ReelsMatrix,
    onReelStopped?: (index: number) => void,
  ) {
    super();
    this.onReelStopped = onReelStopped;

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
    this.freeSpinsTrigger = new FreeSpinsTriggerOverlay(columnWidth, rowHeight);
    const mask = new Graphics().roundRect(0, 0, width, height, 12).fill(0xffffff);
    this.addChild(...this.columns, this.winLine, this.freeSpinsTrigger, mask);
    this.mask = mask;
  }

  setSymbols(reels: ReelsMatrix): void {
    if (reels.length !== REEL_COUNT || reels.some((reel) => reel.length !== VISIBLE_ROWS)) {
      throw new Error(`Expected ${REEL_COUNT} reels with ${VISIBLE_ROWS} symbols each`);
    }

    this.cancelScheduledStarts();
    this.columns.forEach((column, index) => column.setSymbols(reels[index]));
  }

  spin(signal: AbortSignal, turbo = false): void {
    signal.throwIfAborted();
    this.cancelScheduledStarts();
    this.landingSignal = null;
    this.stoppedColumns = 0;
    this.quickStopRequested = false;
    this.turboSpin = turbo;
    this.startSignal = signal;
    signal.addEventListener('abort', this.cancelScheduledStarts, { once: true });

    this.columns[0].spin(signal, turbo);
    for (let index = 1; index < this.columns.length; index += 1) {
      const start = gsap.delayedCall(index * START_INTERVAL_SECONDS, () => {
        this.scheduledStarts.delete(start);
        if (!signal.aborted) this.columns[index].spin(signal, turbo);
        if (this.scheduledStarts.size === 0) this.detachStartSignal();
      });
      this.scheduledStarts.add(start);
    }
  }

  async land(reels: ReelsMatrix, signal: AbortSignal, quickStop = false): Promise<void> {
    if (reels.length !== REEL_COUNT || reels.some((reel) => reel.length !== VISIBLE_ROWS)) {
      throw new Error(`Expected ${REEL_COUNT} reels with ${VISIBLE_ROWS} symbols each`);
    }
    this.landingSignal = signal;
    if (quickStop) this.requestQuickStop(reels, signal);
    try {
      if (quickStop) {
        await Promise.all(this.columns.map((column, index) => column.land(reels[index], signal)));
        this.onReelStopped?.(0);
        return;
      }
      for (let index = 0; index < this.columns.length; index += 1) {
        signal.throwIfAborted();
        await this.columns[index].land(reels[index], signal);
        this.stoppedColumns = index + 1;
        if (!this.quickStopRequested) this.onReelStopped?.(index);
      }
      if (this.quickStopRequested) this.onReelStopped?.(0);
    } finally {
      this.landingSignal = null;
    }
  }

  requestQuickStop(reels: ReelsMatrix, signal: AbortSignal): void {
    if (this.landingSignal !== signal || this.quickStopRequested || signal.aborted) return;
    this.quickStopRequested = true;
    this.cancelScheduledStarts();
    this.columns.forEach((column, index) => {
      if (index >= this.stoppedColumns) column.quickLand(reels[index], signal, this.turboSpin);
    });
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

  showFreeSpinsTrigger(reels: ReelsMatrix, signal: AbortSignal): Promise<void> {
    return this.freeSpinsTrigger.show(reels, signal);
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
