import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { SCROLL_MODAL_COLORS, SCROLL_MODAL_FONT_FAMILY } from '../shared/scroll-modal-theme';

export class AutoPlayButton extends Container {
  private readonly background = new Graphics();
  private readonly caption: Text;
  private buttonWidth = 0;
  private buttonHeight = 0;
  private selected = false;
  private hovered = false;
  private readonly choice: boolean;

  constructor(label: string, onPress: () => void, choice = false) {
    super();
    this.choice = choice;
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.caption = new Text({
      text: label,
      style: {
        fontFamily: SCROLL_MODAL_FONT_FAMILY,
        fontSize: 15,
        fill: choice ? SCROLL_MODAL_COLORS.ink : SCROLL_MODAL_COLORS.buttonText,
      },
    });
    this.caption.anchor.set(0.5);
    this.addChild(this.background, this.caption);
    this.on('pointertap', (event) => {
      event.stopPropagation();
      onPress();
    });
    this.on('pointerover', () => {
      this.hovered = true;
      this.draw();
    });
    this.on('pointerout', () => {
      this.hovered = false;
      this.draw();
    });
  }

  resize(width: number, height: number): void {
    this.buttonWidth = width;
    this.buttonHeight = height;
    this.hitArea = new Rectangle(-width / 2, -height / 2, width, height);
    this.draw();
  }

  setSelected(selected: boolean): void {
    this.selected = selected;
    this.draw();
  }

  private draw(): void {
    const fill = this.hovered ? SCROLL_MODAL_COLORS.buttonHover : SCROLL_MODAL_COLORS.button;
    this.background
      .clear()
      .roundRect(
        -this.buttonWidth / 2,
        -this.buttonHeight / 2,
        this.buttonWidth,
        this.buttonHeight,
        9,
      )
      .fill({ color: fill, alpha: this.choice ? (this.hovered ? 0.14 : 0) : 0.98 })
      .stroke({
        color: this.selected
          ? SCROLL_MODAL_COLORS.buttonBorderSelected
          : SCROLL_MODAL_COLORS.buttonBorder,
        width: this.selected ? 2 : 1,
      });
  }
}
