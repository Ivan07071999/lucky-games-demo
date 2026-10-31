import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { SCROLL_MODAL_COLORS } from '../scroll-modal-theme';

const WIDTH = 280;
const HIT_HEIGHT = 34;

export class SettingsCheckbox extends Container {
  private readonly mark = new Graphics();
  private readonly caption: Text;
  private checked = false;
  private enabled = true;

  constructor(label: string, onToggle: () => void) {
    super();
    this.label = `settings-checkbox-${label.toLowerCase().replaceAll(' ', '-')}`;
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(0, -HIT_HEIGHT / 2, WIDTH, HIT_HEIGHT);

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
    this.mark.eventMode = 'none';
    this.caption.eventMode = 'none';
    this.addChild(this.mark, this.caption);

    this.on('pointertap', (event) => {
      event.stopPropagation();
      if (this.enabled) onToggle();
    });
    this.draw();
  }

  resize(width: number): void {
    this.hitArea = new Rectangle(0, -HIT_HEIGHT / 2, width, HIT_HEIGHT);
  }

  setState(checked: boolean, enabled: boolean): void {
    this.checked = checked;
    this.enabled = enabled;
    this.eventMode = enabled ? 'static' : 'none';
    this.cursor = enabled ? 'pointer' : 'default';
    this.alpha = enabled ? 1 : 0.55;
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
