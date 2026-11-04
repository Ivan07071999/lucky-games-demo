import { Point, Rectangle } from 'pixi.js';

export interface FrameSize {
  width: number;
  height: number;
}

export interface LayoutBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ReelsBoardLayout {
  width: number;
  height: number;
  x: number;
  y: number;
}

export const REELS_FRAME_LAYOUT = {
  scale: 0.55,
  baseScaleX: 0.535,
  baseScaleY: 0.515,
  transparentLeft: 96,
  transparentRight: 69,
  freeSpinsScaleX: 0.705,
  freeSpinsScaleY: 0.678,
  freeSpinsTransparentSide: 30,
  freeSpinsY: 42,
  windowLeft: 320,
  windowRight: 1705,
  boardWidthRatio: 0.65,
  boardHeightRatio: 0.57,
  boardTopRatio: 0.23,
  pivotYDivisor: 2.2,
  logoScale: 0.25,
} as const;

export function getReelsBoardLayout(frame: FrameSize): ReelsBoardLayout {
  const width = frame.width * REELS_FRAME_LAYOUT.scale * REELS_FRAME_LAYOUT.boardWidthRatio;
  const windowCenterX =
    ((REELS_FRAME_LAYOUT.windowLeft + REELS_FRAME_LAYOUT.windowRight) / 2 -
      REELS_FRAME_LAYOUT.transparentLeft) *
    REELS_FRAME_LAYOUT.scale;

  return {
    width,
    height: frame.height * REELS_FRAME_LAYOUT.scale * REELS_FRAME_LAYOUT.boardHeightRatio,
    x: windowCenterX - width / 2,
    y: frame.height * REELS_FRAME_LAYOUT.scale * REELS_FRAME_LAYOUT.boardTopRatio,
  };
}

export function getReelsMachineBounds(bounds: LayoutBounds, baseFrame: FrameSize): Rectangle {
  const left = Math.min(0, bounds.x);
  const top = Math.min(0, bounds.y);

  return new Rectangle(
    left,
    top,
    Math.max(baseFrame.width * REELS_FRAME_LAYOUT.scale, bounds.x + bounds.width) - left,
    Math.max(baseFrame.height * REELS_FRAME_LAYOUT.scale, bounds.y + bounds.height) - top,
  );
}

export function getReelsMachinePivot(bounds: LayoutBounds): Point {
  return new Point(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / REELS_FRAME_LAYOUT.pivotYDivisor,
  );
}
