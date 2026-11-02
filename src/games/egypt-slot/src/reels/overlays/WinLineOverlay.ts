import type { Win } from '@lucky-games/contracts';
import { Graphics } from 'pixi.js';

export class WinLineOverlay extends Graphics {
  private readonly columnWidth: number;
  private readonly rowHeight: number;

  constructor(columnWidth: number, rowHeight: number) {
    super();
    this.columnWidth = columnWidth;
    this.rowHeight = rowHeight;
    this.label = 'win-line-overlay';
    this.eventMode = 'none';
  }

  show(win: Win): void {
    this.clear();
    const positions = [...win.positions].sort(([left], [right]) => left - right);
    if (positions.length < 2) return;

    positions.forEach(([reel, row], index) => {
      const x = (reel + 0.5) * this.columnWidth;
      const y = (row + 0.5) * this.rowHeight;
      if (index === 0) this.moveTo(x, y);
      else this.lineTo(x, y);
    });
    this.stroke({
      width: Math.max(3, Math.min(this.columnWidth, this.rowHeight) * 0.045),
      color: 0xffd87b,
      alpha: 0.95,
      cap: 'round',
      join: 'round',
    });
  }
}
