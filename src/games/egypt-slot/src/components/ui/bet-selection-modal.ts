import 'pixi.js/text-bitmap';
import { BitmapText, Container, Graphics, Rectangle } from 'pixi.js';

const MAX_MODAL_WIDTH = 520;
const MODAL_MARGIN = 16;
const MODAL_PADDING = 20;
const BUTTON_GAP = 8;
const BUTTON_HEIGHT = 46;

class BetOptionButton extends Container {
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
    this.hitArea = new Rectangle(-width / 2, -BUTTON_HEIGHT / 2, width, BUTTON_HEIGHT);
    this.draw();
  }

  setSelected(selected: boolean): void {
    this.selected = selected;
    this.draw();
  }

  private draw(): void {
    const fill = this.selected ? 0xa66a13 : this.hovered ? 0x5b254f : 0x32152f;
    const stroke = this.selected ? 0xffd778 : 0xb87b3a;

    this.background
      .clear()
      .roundRect(-this.buttonWidth / 2, -BUTTON_HEIGHT / 2, this.buttonWidth, BUTTON_HEIGHT, 9)
      .fill({ color: fill, alpha: 0.98 })
      .stroke({ color: stroke, width: this.selected ? 2.5 : 1.5 });
  }
}

export type BetSelectionModalOptions = {
  onSelect: (value: number) => void;
  onClose: () => void;
};

export class BetSelectionModal extends Container {
  private readonly backdrop = new Graphics();
  private readonly card = new Graphics();
  private readonly title: BitmapText;
  private readonly onSelect: (value: number) => void;
  private optionButtons: BetOptionButton[] = [];
  private viewportWidth = 0;
  private viewportHeight = 0;

  constructor({ onSelect, onClose }: BetSelectionModalOptions) {
    super();

    this.label = 'bet-selection-modal';
    this.visible = false;
    this.eventMode = 'none';
    this.onSelect = onSelect;

    this.backdrop.label = 'bet-selection-backdrop';
    this.backdrop.eventMode = 'static';
    this.backdrop.cursor = 'default';
    this.backdrop.on('pointertap', onClose);

    this.card.label = 'bet-selection-card';
    this.card.eventMode = 'static';

    this.title = new BitmapText({
      text: 'SELECT BET',
      style: {
        fontFamily: 'CasinoGoldBold',
        fontSize: 28,
        fill: 0xffe3a1,
        align: 'center',
      },
    });
    this.title.anchor.set(0.5);

    this.addChild(this.backdrop, this.card, this.title);
  }

  open(values: readonly number[], selectedValue: number): void {
    if (!values.length) return;

    this.rebuildOptions(values, selectedValue);
    this.visible = true;
    this.eventMode = 'static';
    this.layout();
  }

  close(): void {
    this.visible = false;
    this.eventMode = 'none';
  }

  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.layout();
  }

  private rebuildOptions(values: readonly number[], selectedValue: number): void {
    this.optionButtons.forEach((button) => button.destroy({ children: true }));
    this.optionButtons = values.map((value) => {
      const button = new BetOptionButton(value, this.onSelect);
      button.setSelected(value === selectedValue);
      this.addChild(button);
      return button;
    });
  }

  private layout(): void {
    if (this.viewportWidth <= 0 || this.viewportHeight <= 0) return;

    this.backdrop
      .clear()
      .rect(0, 0, this.viewportWidth, this.viewportHeight)
      .fill({ color: 0x09030f, alpha: 0.72 });
    this.backdrop.hitArea = new Rectangle(0, 0, this.viewportWidth, this.viewportHeight);

    const columns = this.viewportWidth < 480 ? 4 : 5;
    const modalWidth = Math.min(MAX_MODAL_WIDTH, this.viewportWidth - MODAL_MARGIN * 2);
    const buttonWidth = (modalWidth - MODAL_PADDING * 2 - BUTTON_GAP * (columns - 1)) / columns;
    const rows = Math.ceil(this.optionButtons.length / columns);
    const titleAreaHeight = 58;
    const modalHeight =
      MODAL_PADDING +
      titleAreaHeight +
      rows * BUTTON_HEIGHT +
      (rows - 1) * BUTTON_GAP +
      MODAL_PADDING;
    const modalX = (this.viewportWidth - modalWidth) / 2;
    const modalY = (this.viewportHeight - modalHeight) / 2;

    this.card
      .clear()
      .roundRect(modalX, modalY, modalWidth, modalHeight, 18)
      .fill({ color: 0x211126, alpha: 0.99 })
      .stroke({ color: 0xd69838, width: 3 });
    this.title.position.set(this.viewportWidth / 2, modalY + MODAL_PADDING + 15);

    this.optionButtons.forEach((button, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      button.resize(buttonWidth);
      button.position.set(
        modalX + MODAL_PADDING + buttonWidth / 2 + column * (buttonWidth + BUTTON_GAP),
        modalY +
          MODAL_PADDING +
          titleAreaHeight +
          BUTTON_HEIGHT / 2 +
          row * (BUTTON_HEIGHT + BUTTON_GAP),
      );
    });
  }
}
