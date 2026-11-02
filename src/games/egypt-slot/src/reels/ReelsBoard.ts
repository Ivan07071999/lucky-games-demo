import { Container, Graphics } from 'pixi.js';
import type { CascadeSequence, ReelAnticipationHint, Win } from '@lucky-games/contracts';
import type { ReelsAnimationCue } from '../events/GameEvents';
import { ReelWinPresentation } from './ReelWinPresentation';
import { CascadeReelsAnimation } from './cascade/CascadeReelsAnimation';
import { ClassicReelsAnimation } from './classic/ClassicReelsAnimation';
import type { ReelColumn } from './classic/ReelColumn';
import { createReelColumns } from './createReelColumns';
import { FreeSpinsTriggerOverlay } from './overlays/FreeSpinsTriggerOverlay';
import { WinLineOverlay } from './overlays/WinLineOverlay';
import { REEL_COUNT, VISIBLE_ROWS, type ReelsMatrix } from './reelsConfig';

function assertReelsMatrix(reels: ReelsMatrix): void {
  if (reels.length !== REEL_COUNT || reels.some((reel) => reel.length !== VISIBLE_ROWS)) {
    throw new Error(`Expected ${REEL_COUNT} reels with ${VISIBLE_ROWS} symbols each`);
  }
}

export class ReelsBoard extends Container {
  private readonly columns: ReelColumn[];
  private readonly winPresentation: ReelWinPresentation;
  private readonly freeSpinsTrigger: FreeSpinsTriggerOverlay;
  private readonly classic: ClassicReelsAnimation;
  private readonly cascade: CascadeReelsAnimation;

  constructor(
    width: number,
    height: number,
    initialReels: ReelsMatrix,
    onReelStopped?: (index: number) => void,
    onAnimationCue?: (cue: ReelsAnimationCue) => void,
  ) {
    super();

    this.label = 'reels-board';
    const columnWidth = width / REEL_COUNT;
    const rowHeight = height / VISIBLE_ROWS;
    const { columns, cascadeColumns } = createReelColumns(
      initialReels,
      columnWidth,
      rowHeight,
      onAnimationCue,
    );
    this.columns = columns;

    const winLine = new WinLineOverlay(columnWidth, rowHeight);
    this.winPresentation = new ReelWinPresentation(columns, winLine, onAnimationCue);
    this.freeSpinsTrigger = new FreeSpinsTriggerOverlay(columnWidth, rowHeight);
    this.classic = new ClassicReelsAnimation(columns, onReelStopped, onAnimationCue);
    this.cascade = new CascadeReelsAnimation(
      columns,
      cascadeColumns,
      this.winPresentation,
      onAnimationCue,
    );
    const mask = new Graphics().roundRect(0, 0, width, height, 12).fill(0xffffff);
    this.addChild(...columns, ...cascadeColumns, winLine, this.freeSpinsTrigger, mask);
    this.mask = mask;
  }

  setSymbols(reels: ReelsMatrix): void {
    assertReelsMatrix(reels);

    this.classic.stop();
    this.cascade.stop();
    this.columns.forEach((column, index) => column.setSymbols(reels[index]));
  }

  spin(signal: AbortSignal, turbo = false): void {
    signal.throwIfAborted();
    this.cascade.stop();
    this.classic.spin(signal, turbo);
  }

  async land(
    reels: ReelsMatrix,
    signal: AbortSignal,
    quickStop = false,
    anticipation: ReelAnticipationHint | null = null,
  ): Promise<void> {
    assertReelsMatrix(reels);
    return this.classic.land(reels, signal, quickStop, anticipation);
  }

  requestQuickStop(reels: ReelsMatrix, signal: AbortSignal): void {
    this.classic.requestQuickStop(reels, signal);
  }

  startCascade(reels: ReelsMatrix, signal: AbortSignal, turbo = false): void {
    this.cascade.start(reels, signal, turbo);
  }

  async playCascade(
    sequence: CascadeSequence,
    finalReels: ReelsMatrix,
    signal: AbortSignal,
    turbo = false,
    quickStop = false,
    hybrid = false,
  ): Promise<void> {
    return this.cascade.play(sequence, finalReels, signal, turbo, quickStop, hybrid);
  }

  quickStopCascade(finalReels: ReelsMatrix): void {
    this.cascade.quickStop(finalReels);
  }

  showWins(wins: readonly Win[], signal: AbortSignal): Promise<void> {
    return this.winPresentation.showWins(wins, signal);
  }

  showWild(expandedReels: readonly number[], signal: AbortSignal): Promise<void> {
    return this.winPresentation.showWild(expandedReels, signal);
  }

  showFreeSpinsTrigger(reels: ReelsMatrix, signal: AbortSignal): Promise<void> {
    return this.freeSpinsTrigger.show(reels, signal);
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.classic.stop();
    this.cascade.stop();
    super.destroy(options);
  }
}
