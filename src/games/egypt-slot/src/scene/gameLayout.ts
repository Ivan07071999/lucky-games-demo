export type GameLayoutMode = 'wide' | 'portrait' | 'short-landscape';

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
  mode: GameLayoutMode;
  reels: LayoutPlacement;
  panel: LayoutPlacement;
};

export function getGameLayoutMode(width: number, height: number): GameLayoutMode {
  if (width < height) return 'portrait';
  if (height < 560) return 'short-landscape';
  return 'wide';
}

export function calculateGameLayout(
  width: number,
  height: number,
  reels: LayoutBounds,
  panel: LayoutBounds,
  mode: GameLayoutMode,
): GameLayout {
  const margin = Math.min(28, Math.max(12, Math.min(width, height) * 0.035));
  const gap = Math.min(22, Math.max(10, Math.min(width, height) * 0.02));
  const availableWidth = width - margin * 2;
  const availableHeight = height - margin * 2;

  if (mode === 'portrait') {
    const reelsScale = Math.min(
      availableWidth / reels.width,
      (availableHeight * 0.5) / reels.height,
    );
    const reelsHeight = reels.height * reelsScale;
    const panelScale = Math.min(
      availableWidth / panel.width,
      (availableHeight - reelsHeight - gap) / panel.height,
    );
    const totalHeight = reelsHeight + gap + panel.height * panelScale;
    const top = (height - totalHeight) / 2;

    return {
      mode,
      reels: { left: (width - reels.width * reelsScale) / 2, top, scale: reelsScale },
      panel: {
        left: (width - panel.width * panelScale) / 2,
        top: top + reelsHeight + gap,
        scale: panelScale,
      },
    };
  }

  if (mode === 'short-landscape') {
    const reelsScale = Math.min(
      (availableWidth * 0.55) / reels.width,
      availableHeight / reels.height,
    );
    const reelsWidth = reels.width * reelsScale;
    const panelScale = Math.min(
      (availableWidth - reelsWidth - gap) / panel.width,
      availableHeight / panel.height,
    );
    const totalWidth = reelsWidth + gap + panel.width * panelScale;
    const left = (width - totalWidth) / 2;

    return {
      mode,
      reels: { left, top: (height - reels.height * reelsScale) / 2, scale: reelsScale },
      panel: {
        left: left + reelsWidth + gap,
        top: (height - panel.height * panelScale) / 2,
        scale: panelScale,
      },
    };
  }

  // The controls overlap the bottom of the decorative frame on wide screens.
  const overlap = Math.min(reels.height * 0.15, panel.height * 0.82);
  const totalHeight = reels.height + panel.height - overlap;
  const scale = Math.min(
    1.25,
    availableWidth / Math.max(reels.width, panel.width),
    availableHeight / totalHeight,
  );
  const top = (height - totalHeight * scale) / 2;

  return {
    mode,
    reels: { left: (width - reels.width * scale) / 2, top, scale },
    panel: {
      left: (width - panel.width * scale) / 2,
      top: top + (reels.height - overlap) * scale,
      scale,
    },
  };
}
