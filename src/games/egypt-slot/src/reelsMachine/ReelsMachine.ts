import { Container, Rectangle } from 'pixi.js';
import type { CascadeSequence, ReelAnticipationHint, Win } from '@lucky-games/contracts';
import type { ReelsAnimationCue } from '../events/GameEvents';
import { ReelsBoard } from '../reels/ReelsBoard';
import type { ReelsMatrix } from '../reels/reelsConfig';
import type { ReelsCommand } from './commands';
import type { SceneTheme } from '../scene/sceneTheme';
import { ReelsFrameView } from './ReelsFrameView';
import {
  getReelsBoardLayout,
  getReelsMachineBounds,
  getReelsMachinePivot,
} from './reelsMachineLayout';

export class ReelsMachine extends Container {
  readonly reelsBoard: ReelsBoard;
  private readonly frameView: ReelsFrameView;
  private readonly layoutBounds: Rectangle;

  constructor(
    initialReels: ReelsMatrix,
    onReelStopped?: (index: number) => void,
    onAnimationCue?: (cue: ReelsAnimationCue) => void,
  ) {
    super();

    this.frameView = new ReelsFrameView();
    const boardLayout = getReelsBoardLayout(this.frameView.getBaseSourceSize());
    this.reelsBoard = new ReelsBoard(
      boardLayout.width,
      boardLayout.height,
      initialReels,
      onReelStopped,
      onAnimationCue,
    );
    this.reelsBoard.position.set(boardLayout.x, boardLayout.y);

    this.addChild(this.frameView.background, this.reelsBoard, this.frameView.logo);

    this.layoutBounds = getReelsMachineBounds(
      this.getLocalBounds(),
      this.frameView.getBaseFrameSize(),
    );
    this.pivot.copyFrom(getReelsMachinePivot(this.layoutBounds));
  }

  getLayoutBounds(): Rectangle {
    return this.layoutBounds.clone();
  }

  setTheme(theme: SceneTheme): void {
    this.frameView.setTheme(theme);
  }

  setSymbols(reels: ReelsMatrix): void {
    this.reelsBoard.setSymbols(reels);
  }

  execute(command: ReelsCommand, signal: AbortSignal): void | Promise<void> {
    signal.throwIfAborted();
    return command(this, signal);
  }

  spin(signal: AbortSignal, turbo = false): void {
    this.reelsBoard.spin(signal, turbo);
  }

  startCascade(reels: ReelsMatrix, signal: AbortSignal, turbo = false): void {
    this.reelsBoard.startCascade(reels, signal, turbo);
  }

  playCascade(
    sequence: CascadeSequence,
    finalReels: ReelsMatrix,
    signal: AbortSignal,
    turbo = false,
    quickStop = false,
    hybrid = false,
  ): Promise<void> {
    return this.reelsBoard.playCascade(sequence, finalReels, signal, turbo, quickStop, hybrid);
  }

  quickStopCascade(finalReels: ReelsMatrix): void {
    this.reelsBoard.quickStopCascade(finalReels);
  }

  land(
    reels: ReelsMatrix,
    signal: AbortSignal,
    quickStop = false,
    anticipation: ReelAnticipationHint | null = null,
  ): Promise<void> {
    return this.reelsBoard.land(reels, signal, quickStop, anticipation);
  }

  requestQuickStop(reels: ReelsMatrix, signal: AbortSignal): void {
    this.reelsBoard.requestQuickStop(reels, signal);
  }

  showWins(wins: readonly Win[], signal: AbortSignal): Promise<void> {
    return this.reelsBoard.showWins(wins, signal);
  }

  showWild(expandedReels: readonly number[], signal: AbortSignal): Promise<void> {
    return this.reelsBoard.showWild(expandedReels, signal);
  }

  showFreeSpinsTrigger(reels: ReelsMatrix, signal: AbortSignal): Promise<void> {
    return this.reelsBoard.showFreeSpinsTrigger(reels, signal);
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    super.destroy(options);
    this.frameView.destroy();
  }
}
