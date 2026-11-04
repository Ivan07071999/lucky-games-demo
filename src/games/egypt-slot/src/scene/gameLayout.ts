import { PANEL_OVERLAP_RATIO, REELS_OVERLAP_RATIO, REELS_WIDTH_ALLOWANCE } from './layoutConfig';

export type LayoutBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LayoutPlacement = {
  left: number;
  top: number;
  scale: number;
};

export type GameLayout = {
  reels: LayoutPlacement;
  panel: LayoutPlacement;
};

type GameLayoutOptions = {
  compactPanel: boolean;
  panelHeightForReels: number;
};

export function calculateGameLayout(
  width: number,
  height: number,
  reels: LayoutBounds,
  panel: LayoutBounds,
  { compactPanel, panelHeightForReels }: GameLayoutOptions,
): GameLayout {
  const margin = Math.min(28, Math.max(12, Math.min(width, height) * 0.035));
  const availableWidth = width - margin + REELS_WIDTH_ALLOWANCE;
  const panelAvailableWidth = width - margin * 0.5;
  const availableHeight = height - margin * 2;

  const baseOverlap = Math.min(
    reels.height * REELS_OVERLAP_RATIO,
    panelHeightForReels * PANEL_OVERLAP_RATIO,
  );
  const baseHeight = reels.height + panelHeightForReels - baseOverlap;
  const reelsScale = Math.min(1.25, availableWidth / reels.width, availableHeight / baseHeight);
  const reelsHeight = reels.height * reelsScale;
  let panelScale = Math.min(reelsScale, panelAvailableWidth / panel.width);

  if (compactPanel) {
    const maxPanelHeight = Math.min(
      availableHeight - reelsHeight * (1 - REELS_OVERLAP_RATIO),
      (availableHeight - reelsHeight) / (1 - PANEL_OVERLAP_RATIO),
    );
    panelScale = Math.min(
      panelAvailableWidth / panel.width,
      Math.max(0, maxPanelHeight / panel.height),
    );
  }

  const panelHeight = panel.height * panelScale;
  const overlap = Math.min(reelsHeight * REELS_OVERLAP_RATIO, panelHeight * PANEL_OVERLAP_RATIO);
  const totalHeight = reelsHeight + panelHeight - overlap;
  const top = (height - totalHeight) / 2;

  return {
    reels: { left: (width - reels.width * reelsScale) / 2, top, scale: reelsScale },
    panel: {
      left: (width - panel.width * panelScale) / 2,
      top: top + reelsHeight - overlap,
      scale: panelScale,
    },
  };
}
