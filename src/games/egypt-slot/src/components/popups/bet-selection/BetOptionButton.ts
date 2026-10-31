import 'pixi.js/text-bitmap';
import { BitmapText, Container, Graphics, Rectangle } from 'pixi.js';
import { SCROLL_MODAL_COLORS } from '../shared/scroll-modal-theme';
import { BET_OPTION_HEIGHT } from './bet-selection-layout';

export class BetOptionButton extends Container {
  readonly value: number;
  private readonly background = new Graphics();
  private readonly valueText: BitmapText;
  private buttonWidth = 0;
  private selected = false;
  private hovered = false;

  constructor(value: number, onSelect: (value: number) => void) {
    super();

    this.value = value;
    this.label = `bet-option-${value}`;
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.valueText = new BitmapText({
      text: String(value),
      style: {
        fontFamily: 'CasinoGold',
        fontSize: 26,
        fill: SCROLL_MODAL_COLORS.ink,
        align: 'center',
      },
    });
    this.valueText.anchor.set(0.5);
    this.addChild(this.background, this.valueText);

    this.on('pointertap', (event) => {
      event.stopPropagation();
      onSelect(this.value);
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

  resize(width: number): void {
    this.buttonWidth = width;
    this.hitArea = new Rectangle(-width / 2, -BET_OPTION_HEIGHT / 2, width, BET_OPTION_HEIGHT);
    this.draw();
  }

  setSelected(selected: boolean): void {
    this.selected = selected;
    this.draw();
  }

  private draw(): void {
    const stroke = this.selected
      ? SCROLL_MODAL_COLORS.buttonBorderSelected
      : SCROLL_MODAL_COLORS.buttonBorder;

    this.background
      .clear()
      .roundRect(
        -this.buttonWidth / 2,
        -BET_OPTION_HEIGHT / 2,
        this.buttonWidth,
        BET_OPTION_HEIGHT,
        9,
      )
      .fill({ color: SCROLL_MODAL_COLORS.buttonHover, alpha: this.hovered ? 0.14 : 0 })
      .stroke({ color: stroke, width: this.selected ? 2.5 : 1.5 });
  }
}
