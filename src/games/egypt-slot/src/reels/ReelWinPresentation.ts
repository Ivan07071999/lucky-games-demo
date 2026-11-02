import type { Win } from '@lucky-games/contracts';
import type { ReelsAnimationCue } from '../events/GameEvents';
import type { ReelColumn } from './classic/ReelColumn';
import type { WinLineOverlay } from './overlays/WinLineOverlay';
import { getWinRows } from './winRows';

export class ReelWinPresentation {
  private readonly columns: ReelColumn[];
  private readonly winLine: WinLineOverlay;
  private readonly onAnimationCue?: (cue: ReelsAnimationCue) => void;

  constructor(
    columns: ReelColumn[],
    winLine: WinLineOverlay,
    onAnimationCue?: (cue: ReelsAnimationCue) => void,
  ) {
    this.columns = columns;
    this.winLine = winLine;
    this.onAnimationCue = onAnimationCue;
  }

  async showWins(wins: readonly Win[], signal: AbortSignal): Promise<void> {
    try {
      for (const win of wins) {
        signal.throwIfAborted();
        this.showLine(win);
        const rows = getWinRows(win);
        await Promise.all(
          this.columns.map((column, index) => column.showWinRows(rows[index], signal)),
        );
      }
    } finally {
      this.clearLine();
    }
  }

  async showWild(expandedReels: readonly number[], signal: AbortSignal): Promise<void> {
    for (const reelIndex of expandedReels) {
      signal.throwIfAborted();
      await this.columns[reelIndex]?.showWild(signal);
    }
  }

  showLine(win: Win): void {
    this.winLine.show(win);
    if (win.positions.length >= 2) this.onAnimationCue?.('winLine');
  }

  clearLine(): void {
    this.winLine.clear();
  }
}
