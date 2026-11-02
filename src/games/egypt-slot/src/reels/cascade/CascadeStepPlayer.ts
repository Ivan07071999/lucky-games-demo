import type { CascadeSequence, Win } from '@lucky-games/contracts';
import type { ReelWinPresentation } from '../ReelWinPresentation';
import { getWinRows } from '../winRows';
import type { CascadeColumn } from './CascadeColumn';
import { reelDelay } from './cascadeTiming';

type CascadeStep = CascadeSequence['steps'][number];

export class CascadeStepPlayer {
  private readonly columns: CascadeColumn[];
  private readonly winPresentation: ReelWinPresentation;
  private cancelPulse: (() => void) | null = null;

  constructor(columns: CascadeColumn[], winPresentation: ReelWinPresentation) {
    this.columns = columns;
    this.winPresentation = winPresentation;
  }

  async play(
    step: CascadeStep,
    signal: AbortSignal,
    turbo: boolean,
    isActive: () => boolean,
  ): Promise<void> {
    for (const win of step.wins) {
      this.winPresentation.showLine(win);
      await this.pulseWin(win, signal);
      if (!isActive()) return;
    }

    this.winPresentation.clearLine();
    const removedRows = this.columns.map((_, reelIndex) =>
      step.removedPositions.filter(([index]) => index === reelIndex).map(([, row]) => row),
    );
    await Promise.all(
      this.columns.map((column, reelIndex) =>
        column.removeRows(removedRows[reelIndex], signal, turbo, reelDelay(reelIndex, turbo)),
      ),
    );
    await Promise.all(
      this.columns.map((column, reelIndex) =>
        column.refill(
          removedRows[reelIndex],
          step.after[reelIndex],
          signal,
          turbo,
          reelDelay(reelIndex, turbo),
        ),
      ),
    );
  }

  cancel(): void {
    this.cancelPulse?.();
  }

  private async pulseWin(win: Win, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    const pulse = new AbortController();
    const onAbort = (): void => pulse.abort(signal.reason);
    const cancelPulse = (): void => pulse.abort(new Error('Cascade presentation cancelled'));
    this.cancelPulse = cancelPulse;
    signal.addEventListener('abort', onAbort, { once: true });
    try {
      const rows = getWinRows(win);
      await Promise.all(
        this.columns.map((column, index) => column.showWinRows(rows[index], pulse.signal)),
      );
    } finally {
      signal.removeEventListener('abort', onAbort);
      if (this.cancelPulse === cancelPulse) this.cancelPulse = null;
    }
  }
}
