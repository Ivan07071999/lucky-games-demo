import { Graphics, Rectangle } from 'pixi.js';
import { WIN_POPUP_LAYOUT } from './winPopupConfig';

export class WinPopupBackdrop extends Graphics {
  constructor() {
    super();
    this.eventMode = 'static';
  }

  setViewport(width: number, height: number): void {
    this.clear().rect(0, 0, width, height).fill(WIN_POPUP_LAYOUT.backdrop);
    this.hitArea = new Rectangle(0, 0, width, height);
  }
}
