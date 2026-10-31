export const SPIN_DIAMETER = 104;

const TOOL_ICON_SIZE = 28;
const TOOL_ROW_OFFSET = TOOL_ICON_SIZE / 2 + 4;
const COMPACT_PANEL_GAP = 48;
const COMPACT_ACTION_GAP = 16;
const BUTTON_GAP = 8;

export type BetPanelLayout = 'wide' | 'compact';

type Point = { x: number; y: number };

export type BetPanelDimensions = {
  leftWidth: number;
  leftHeight: number;
  rightWidth: number;
  rightHeight: number;
  actionWidth: number;
};

export type BetPanelPositions = {
  left: Point;
  right: Point;
  autoPlay: Point;
  spin: Point;
  maxBet: Point;
  utilities: Point;
};

export function calculateBetPanelPositions(
  layout: BetPanelLayout,
  dimensions: BetPanelDimensions,
): BetPanelPositions {
  const { leftWidth, leftHeight, rightWidth, rightHeight, actionWidth } = dimensions;
  const sideButtonOffset = SPIN_DIAMETER / 2 + actionWidth / 2 + BUTTON_GAP;
  let left: Point;
  let right: Point;
  let autoPlay: Point;
  let spin: Point;
  let maxBet: Point;

  if (layout === 'compact') {
    const rightY = leftHeight + COMPACT_PANEL_GAP;
    const actionY = rightY + rightHeight / 2 + COMPACT_ACTION_GAP + SPIN_DIAMETER / 2;
    left = { x: 0, y: 0 };
    right = { x: 0, y: rightY };
    autoPlay = { x: -sideButtonOffset, y: actionY + 7 };
    spin = { x: 0, y: actionY };
    maxBet = { x: sideButtonOffset, y: actionY + 7 };
  } else {
    const backgroundInnerEdge = sideButtonOffset + actionWidth / 2 + BUTTON_GAP;
    left = { x: -backgroundInnerEdge - leftWidth / 2, y: 10 };
    right = { x: backgroundInnerEdge + rightWidth / 2, y: 10 };
    autoPlay = { x: -sideButtonOffset, y: 0 };
    spin = { x: 0, y: -20 };
    maxBet = { x: sideButtonOffset, y: 0 };
  }

  return {
    left,
    right,
    autoPlay,
    spin,
    maxBet,
    utilities: {
      x: left.x - leftWidth / 2 + TOOL_ICON_SIZE / 2,
      y: left.y + leftHeight / 2 + TOOL_ROW_OFFSET,
    },
  };
}
