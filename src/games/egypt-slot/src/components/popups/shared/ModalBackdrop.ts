import { Graphics, Rectangle } from 'pixi.js';

export class ModalBackdrop extends Graphics {
  private readonly color: number;
  private readonly opacity: number;

  constructor(color: number, opacity: number, onClose: () => void) {
    super();
    this.color = color;
    this.opacity = opacity;
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointertap', onClose);
  }

  setViewport(width: number, height: number): void {
    this.clear().rect(0, 0, width, height).fill({ color: this.color, alpha: this.opacity });
    this.hitArea = new Rectangle(0, 0, width, height);
  }
}
