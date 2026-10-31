import { Container, Graphics, Rectangle } from 'pixi.js';
import { SCROLL_MODAL_COLORS } from './scroll-modal-theme';

export class ScrollModalCloseButton extends Container {
  private readonly icon = new Graphics();
  private hovered = false;

  constructor(onClose: () => void) {
    super();
    this.label = 'scroll-modal-close';
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(-20, -20, 40, 40);
    this.addChild(this.icon);
    this.on('pointertap', (event) => {
      event.stopPropagation();
      onClose();
    });
    this.on('pointerover', () => {
      this.hovered = true;
      this.draw();
    });
    this.on('pointerout', () => {
      this.hovered = false;
      this.draw();
    });
    this.draw();
  }

  private draw(): void {
    this.icon.clear().circle(0, 0, 15);
    if (this.hovered) {
      this.icon.fill({ color: SCROLL_MODAL_COLORS.buttonBorderSelected, alpha: 0.2 });
    }
    this.icon
      .stroke({ color: SCROLL_MODAL_COLORS.buttonBorder, width: 2 })
      .moveTo(-5, -5)
      .lineTo(5, 5)
      .moveTo(5, -5)
      .lineTo(-5, 5)
      .stroke({ color: SCROLL_MODAL_COLORS.ink, width: 2 });
  }
}
