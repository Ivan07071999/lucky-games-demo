import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { SCROLL_MODAL_COLORS } from '../scroll-modal-theme';

export class AutoPlayToggle extends Container {
  private readonly mark = new Graphics();
  private readonly caption: Text;
  private checked = false;

  constructor(label: string, onPress: () => void) {
    super();
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.caption = new Text({
      text: label,
      style: {
        fontFamily: 'Manrope Variable, sans-serif',
        fontSize: 15,
        fill: SCROLL_MODAL_COLORS.ink,
      },
    });
    this.caption.anchor.set(0, 0.5);
    this.caption.position.x = 28;
    this.addChild(this.mark, this.caption);
    this.on('pointertap', (event) => {
      event.stopPropagation();
      onPress();
    });
  }

  resize(width: number): void {
    this.hitArea = new Rectangle(0, -17, width, 34);
    this.draw();
  }

  setChecked(checked: boolean): void {
    this.checked = checked;
    this.draw();
  }

  private draw(): void {
    this.mark
      .clear()
      .circle(10, 0, 9)
      .stroke({
        color: this.checked ? SCROLL_MODAL_COLORS.buttonBorderSelected : SCROLL_MODAL_COLORS.button,
        width: 1.5,
      });
    if (this.checked) {
      this.mark
        .moveTo(6, 0)
        .lineTo(9, 3)
        .lineTo(14, -4)
        .stroke({ color: SCROLL_MODAL_COLORS.heading, width: 2 });
    }
  }
}
