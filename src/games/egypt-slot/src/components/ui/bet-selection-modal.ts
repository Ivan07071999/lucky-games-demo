import 'pixi.js/text-bitmap';
import { BitmapText, Container, Graphics, Rectangle } from 'pixi.js';
import { ScrollModalBackground } from './scroll-modal-background';
import { ScrollModalCloseButton } from './scroll-modal-close-button';
import { SCROLL_MODAL_COLORS } from './scroll-modal-theme';

const MAX_MODAL_WIDTH = 520;
const MODAL_MARGIN = 16;
const MODAL_PADDING_X = 44;
const MODAL_PADDING_TOP = 48;
const MODAL_PADDING_BOTTOM = 40;
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
    this.hitArea = new Rectangle(-width / 2, -BUTTON_HEIGHT / 2, width, BUTTON_HEIGHT);
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
      .roundRect(-this.buttonWidth / 2, -BUTTON_HEIGHT / 2, this.buttonWidth, BUTTON_HEIGHT, 9)
      .fill({ color: SCROLL_MODAL_COLORS.buttonHover, alpha: this.hovered ? 0.14 : 0 })
      .stroke({ color: stroke, width: this.selected ? 2.5 : 1.5 });
  }
}

export type BetSelectionModalOptions = {
  onSelect: (value: number) => void;
  onClose: () => void;
};

export class BetSelectionModal extends Container {
  private readonly backdrop = new Graphics();
  private readonly content = new Container();
  private readonly card = new ScrollModalBackground();
  private readonly closeButton: ScrollModalCloseButton;
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
    this.closeButton = new ScrollModalCloseButton(onClose);
    this.title = new BitmapText({
      text: 'SELECT BET',
      style: {
        fontFamily: 'CasinoGoldBold',
        fontSize: 28,
        fill: SCROLL_MODAL_COLORS.heading,
        align: 'center',
      },
    });
    this.title.anchor.set(0.5);

    this.addChild(this.backdrop, this.content);
    this.content.addChild(this.card, this.title, this.closeButton);
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
      this.content.addChild(button);
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

    const modalWidth = Math.min(MAX_MODAL_WIDTH, this.viewportWidth - MODAL_MARGIN * 2);
    const columns = modalWidth >= 480 ? 5 : modalWidth >= 360 ? 4 : modalWidth >= 260 ? 3 : 2;
    const buttonWidth = (modalWidth - MODAL_PADDING_X * 2 - BUTTON_GAP * (columns - 1)) / columns;
    const rows = Math.ceil(this.optionButtons.length / columns);
    const titleAreaHeight = 58;
    const modalHeight =
      MODAL_PADDING_TOP +
      titleAreaHeight +
      rows * BUTTON_HEIGHT +
      (rows - 1) * BUTTON_GAP +
      MODAL_PADDING_BOTTOM;
    const scale = Math.min(1, (this.viewportHeight - MODAL_MARGIN * 2) / modalHeight);
    this.content.scale.set(scale);
    this.content.position.set(
      (this.viewportWidth - modalWidth * scale) / 2,
      (this.viewportHeight - modalHeight * scale) / 2,
    );

    this.card.resize(modalWidth, modalHeight);
    this.title.position.set(modalWidth / 2, MODAL_PADDING_TOP + 7);
    this.closeButton.position.set(modalWidth - MODAL_PADDING_X, MODAL_PADDING_TOP + 7);

    this.optionButtons.forEach((button, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      button.resize(buttonWidth);
      button.position.set(
        MODAL_PADDING_X + buttonWidth / 2 + column * (buttonWidth + BUTTON_GAP),
        MODAL_PADDING_TOP +
          titleAreaHeight +
          BUTTON_HEIGHT / 2 +
          row * (BUTTON_HEIGHT + BUTTON_GAP),
      );
    });
  }
}
