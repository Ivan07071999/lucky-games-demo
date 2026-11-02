import { Graphics } from 'pixi.js';
import type { ReelsMatrix } from '../reelsConfig';

export function createFreeSpinsTriggerHighlights(
  reels: ReelsMatrix,
  cellWidth: number,
  cellHeight: number,
): Graphics[] {
  const highlights: Graphics[] = [];
  const padding = Math.min(cellWidth, cellHeight) * 0.08;
  const width = cellWidth - padding * 2;
  const height = cellHeight - padding * 2;

  reels.forEach((symbols, reelIndex) => {
    symbols.forEach((symbol, rowIndex) => {
      if (symbol !== 'highScarab') return;

      const highlight = new Graphics()
        .roundRect(-width / 2, -height / 2, width, height, 12)
        .fill({ color: 0xffd879, alpha: 0.12 })
        .stroke({ color: 0xffe6a1, width: 3, alpha: 0.95 });
      highlight.position.set((reelIndex + 0.5) * cellWidth, (rowIndex + 0.5) * cellHeight);
      highlight.alpha = 0;
      highlights.push(highlight);
    });
  });

  return highlights;
}
