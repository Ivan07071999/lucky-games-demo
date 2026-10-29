import { Container, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import type { CascadeSequence, ReelAnticipationHint, Win } from '@lucky-games/contracts';
import { ReelColumn } from './ReelColumn';
import { CascadeColumn } from './CascadeColumn';
import { FreeSpinsTriggerOverlay } from './FreeSpinsTriggerOverlay';
import { REEL_COUNT, VISIBLE_ROWS, type ReelsMatrix } from './reelsConfig';
import { WinLineOverlay } from './WinLineOverlay';

const START_INTERVAL_SECONDS = 0.09;
const CASCADE_REEL_INTERVAL_SECONDS = 0.16;
const TURBO_CASCADE_REEL_INTERVAL_SECONDS = 0.045;

function cascadeReelDelay(index: number, turbo: boolean): number {
  return index * (turbo ? TURBO_CASCADE_REEL_INTERVAL_SECONDS : CASCADE_REEL_INTERVAL_SECONDS);
}

export class ReelsBoard extends Container {
  private readonly columns: ReelColumn[];
  private readonly cascadeColumns: CascadeColumn[];
  private readonly winLine: WinLineOverlay;
  private readonly freeSpinsTrigger: FreeSpinsTriggerOverlay;
  private readonly onReelStopped?: (index: number) => void;
  private readonly scheduledStarts = new Set<gsap.core.Tween>();
  private startSignal: AbortSignal | null = null;
  private landingSignal: AbortSignal | null = null;
  private stoppedColumns = 0;
  private quickStopRequested = false;
  private turboSpin = false;
  private skipAnticipationWait: (() => void) | null = null;
  private cancelAnticipationWait: (() => void) | null = null;
  private cascadeActive = false;
  private cascadeQuickStop = false;
  private cascadeStartTask: Promise<void> | null = null;
  private skipCascadeWait: (() => void) | null = null;

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
    this.cascadeColumns = initialReels.map((values, index) => {
      const column = new CascadeColumn(columnWidth, rowHeight, values);
      column.position.x = index * columnWidth;
      column.visible = false;
      return column;
    });

    this.winLine = new WinLineOverlay(columnWidth, rowHeight);
    this.freeSpinsTrigger = new FreeSpinsTriggerOverlay(columnWidth, rowHeight);
    const mask = new Graphics().roundRect(0, 0, width, height, 12).fill(0xffffff);
    this.addChild(
      ...this.columns,
      ...this.cascadeColumns,
      this.winLine,
      this.freeSpinsTrigger,
      mask,
    );
    this.mask = mask;
  }

  setSymbols(reels: ReelsMatrix): void {
    if (reels.length !== REEL_COUNT || reels.some((reel) => reel.length !== VISIBLE_ROWS)) {
      throw new Error(`Expected ${REEL_COUNT} reels with ${VISIBLE_ROWS} symbols each`);
    }

    this.cancelAnticipationWait?.();
    this.cancelScheduledStarts();
    this.stopCascade();
    this.columns.forEach((column, index) => column.setSymbols(reels[index]));
  }

  spin(signal: AbortSignal, turbo = false): void {
    signal.throwIfAborted();
    this.stopCascade();
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

  async land(
    reels: ReelsMatrix,
    signal: AbortSignal,
    quickStop = false,
    anticipation: ReelAnticipationHint | null = null,
  ): Promise<void> {
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
        if (anticipation?.reelIndex === index && !this.quickStopRequested) {
          await this.waitForAnticipation(anticipation.extraSpinMs, signal);
        }
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
    this.skipAnticipationWait?.();
    this.columns.forEach((column, index) => {
      if (index >= this.stoppedColumns) column.quickLand(reels[index], signal, this.turboSpin);
    });
  }

  startCascade(reels: ReelsMatrix, signal: AbortSignal, turbo = false): void {
    signal.throwIfAborted();
    this.stopCascade();
    this.cascadeActive = true;
    this.cascadeQuickStop = false;
    this.columns.forEach((column, index) => {
      column.setSymbols(reels[index]);
      column.visible = false;
    });
    this.cascadeColumns.forEach((column, index) => {
      column.setValues(reels[index]);
      column.visible = true;
    });
    this.cascadeStartTask = Promise.all(
      this.cascadeColumns.map((column, index) =>
        column.exit(signal, turbo, cascadeReelDelay(index, turbo)),
      ),
    ).then(() => undefined);
    void this.cascadeStartTask.catch(() => undefined);
  }

  async playCascade(
    sequence: CascadeSequence,
    finalReels: ReelsMatrix,
    signal: AbortSignal,
    turbo = false,
    quickStop = false,
    hybrid = false,
  ): Promise<void> {
    signal.throwIfAborted();
    if (hybrid && !quickStop) {
      this.stopCascade();
      this.cascadeActive = true;
      this.cascadeQuickStop = false;
      this.columns.forEach((column) => (column.visible = false));
      this.cascadeColumns.forEach((column, index) => {
        column.setValues(sequence.initialReels[index]);
        column.visible = true;
      });
    }
    if (!this.cascadeActive || quickStop) {
      this.quickStopCascade(finalReels);
      return;
    }
    try {
      if (!hybrid) {
        await this.cascadeStartTask;
        if (!this.cascadeActive) return;
        await Promise.all(
          this.cascadeColumns.map((column, index) =>
            column.enter(
              sequence.initialReels[index],
              signal,
              turbo,
              cascadeReelDelay(index, turbo),
            ),
          ),
        );
      }
      await this.playCascadeSteps(sequence, signal, turbo);
    } catch (error) {
      if (!this.cascadeQuickStop || signal.aborted) throw error;
    } finally {
      if (this.cascadeActive) this.finishCascade(finalReels);
    }
  }

  private async playCascadeSteps(
    sequence: CascadeSequence,
    signal: AbortSignal,
    turbo: boolean,
  ): Promise<void> {
    for (const step of sequence.steps) {
      if (!this.cascadeActive) return;
      for (const win of step.wins) {
        this.winLine.show(win);
        await this.waitForCascade(turbo ? 0.08 : 0.27, signal);
        if (!this.cascadeActive) return;
      }
      this.winLine.clear();
      const removedRows = this.cascadeColumns.map((_, reelIndex) =>
        step.removedPositions.filter(([index]) => index === reelIndex).map(([, row]) => row),
      );
      await Promise.all(
        this.cascadeColumns.map((column, reelIndex) =>
          column.removeRows(
            removedRows[reelIndex],
            signal,
            turbo,
            cascadeReelDelay(reelIndex, turbo),
          ),
        ),
      );
      await Promise.all(
        this.cascadeColumns.map((column, reelIndex) =>
          column.refill(
            removedRows[reelIndex],
            step.after[reelIndex],
            signal,
            turbo,
            cascadeReelDelay(reelIndex, turbo),
          ),
        ),
      );
    }
  }

  quickStopCascade(finalReels: ReelsMatrix): void {
    this.cascadeQuickStop = true;
    this.finishCascade(finalReels);
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
    this.cancelAnticipationWait?.();
    this.stopCascade();
    super.destroy(options);
  }

  private stopCascade(): void {
    this.skipCascadeWait?.();
    this.cascadeColumns.forEach((column) => {
      column.cancel();
      column.visible = false;
    });
    this.columns.forEach((column) => (column.visible = true));
    this.winLine.clear();
    this.cascadeActive = false;
    this.cascadeStartTask = null;
  }

  private finishCascade(finalReels: ReelsMatrix): void {
    this.stopCascade();
    this.columns.forEach((column, index) => column.setSymbols(finalReels[index]));
    this.onReelStopped?.(0);
  }

  private waitForCascade(seconds: number, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      let delay: gsap.core.Tween | null = null;
      const cleanup = (): void => {
        signal.removeEventListener('abort', onAbort);
        this.skipCascadeWait = null;
      };
      const finish = (): void => {
        if (settled) return;
        settled = true;
        delay?.kill();
        cleanup();
        resolve();
      };
      const onAbort = (): void => {
        if (settled) return;
        settled = true;
        delay?.kill();
        cleanup();
        reject(signal.reason ?? new Error('Cascade presentation cancelled'));
      };
      this.skipCascadeWait = finish;
      signal.addEventListener('abort', onAbort, { once: true });
      delay = gsap.delayedCall(seconds, finish);
      if (signal.aborted) onAbort();
    });
  }

  private waitForAnticipation(extraSpinMs: number, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      let delay: gsap.core.Tween | null = null;
      const cleanup = (): void => {
        signal.removeEventListener('abort', onAbort);
        this.skipAnticipationWait = null;
        this.cancelAnticipationWait = null;
      };
      const finish = (): void => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };
      const onAbort = (): void => {
        if (settled) return;
        settled = true;
        delay?.kill();
        cleanup();
        reject(signal.reason ?? new Error('Reel anticipation cancelled'));
      };
      this.skipAnticipationWait = () => {
        delay?.kill();
        finish();
      };
      this.cancelAnticipationWait = onAbort;
      signal.addEventListener('abort', onAbort, { once: true });
      delay = gsap.delayedCall(extraSpinMs / 1000, finish);
      if (signal.aborted) onAbort();
    });
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
