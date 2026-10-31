import 'pixi.js/text-bitmap';
import { BitmapText, Container } from 'pixi.js';
import { fitModalToViewport } from '../shared/modal-layout';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { ScrollModalBackground } from '../shared/ScrollModalBackground';
import { ScrollModalCloseButton } from '../shared/ScrollModalCloseButton';
import { SCROLL_MODAL_COLORS } from '../shared/scroll-modal-theme';
import { BetOptionsGrid } from './BetOptionsGrid';
import {
  BET_MODAL_MARGIN,
  BET_MODAL_PADDING_TOP,
  BET_MODAL_PADDING_X,
  BET_MODAL_TITLE_HEIGHT,
  getBetSelectionLayout,
} from './bet-selection-layout';

export type BetSelectionModalOptions = {
  onSelect: (value: number) => void;
  onClose: () => void;
};

export class BetSelectionModal extends Container {
  private readonly backdrop: ModalBackdrop;
  private readonly content = new Container();
  private readonly card = new ScrollModalBackground();
  private readonly closeButton: ScrollModalCloseButton;
  private readonly title: BitmapText;
  private readonly options: BetOptionsGrid;
  private viewportWidth = 0;
  private viewportHeight = 0;

  constructor({ onSelect, onClose }: BetSelectionModalOptions) {
    super();

    this.label = 'bet-selection-modal';
    this.visible = false;
    this.eventMode = 'none';

    this.backdrop = new ModalBackdrop(0x09030f, 0.72, onClose);
    this.backdrop.label = 'bet-selection-backdrop';

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
    this.options = new BetOptionsGrid(onSelect);

    this.addChild(this.backdrop, this.content);
    this.content.addChild(this.card, this.title, this.options, this.closeButton);
  }

  open(values: readonly number[], selectedValue: number): void {
    if (!values.length) return;

    this.options.setOptions(values, selectedValue);
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

  private layout(): void {
    if (this.viewportWidth <= 0 || this.viewportHeight <= 0) return;

    this.backdrop.setViewport(this.viewportWidth, this.viewportHeight);

    const { width, height, columns, buttonWidth } = getBetSelectionLayout(
      this.viewportWidth,
      this.options.optionCount,
    );
    const placement = fitModalToViewport(
      this.viewportWidth,
      this.viewportHeight,
      width,
      height,
      BET_MODAL_MARGIN,
    );
    this.content.scale.set(placement.scale);
    this.content.position.set(placement.x, placement.y);

    this.card.resize(width, height);
    this.title.position.set(width / 2, BET_MODAL_PADDING_TOP + 7);
    this.closeButton.position.set(width - BET_MODAL_PADDING_X, BET_MODAL_PADDING_TOP + 7);
    this.options.position.set(BET_MODAL_PADDING_X, BET_MODAL_PADDING_TOP + BET_MODAL_TITLE_HEIGHT);
    this.options.layout(columns, buttonWidth);
  }
}
