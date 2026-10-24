import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { autorun, type IReactionDisposer } from 'mobx';
import type { AutoPlayStartResult } from '../../controllers/auto-play-controller/AutoPlayController';
import { AUTO_PLAY_COUNTS } from '../../stores/AutoPlayStore';
import type { SlotStore } from '../../stores/SlotStore';
import { ScrollModalBackground } from './scroll-modal-background';
import { ScrollModalCloseButton } from './scroll-modal-close-button';
import { SCROLL_MODAL_COLORS } from './scroll-modal-theme';

const CARD_HEIGHT = 570;
const CARD_MAX_WIDTH = 520;
const SIDE_MARGIN = 12;
const CONTENT_PADDING_X = 44;

class ModalButton extends Container {
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
        fontFamily: 'Manrope Variable, sans-serif',
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

class ModalToggle extends Container {
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

export class AutoPlayModal extends Container {
  private readonly store: SlotStore;
  private readonly onStart: () => AutoPlayStartResult;
  private readonly backdrop = new Graphics();
  private readonly content = new Container();
  private readonly card = new ScrollModalBackground();
  private readonly closeButton = new ScrollModalCloseButton(() => this.close());
  private readonly title = this.makeText('AUTO PLAY', 24, SCROLL_MODAL_COLORS.heading);
  private readonly subtitle = this.makeText('Automatic spins with the current bet', 12);
  private readonly spinHeading = this.makeText('NUMBER OF SPINS', 15, SCROLL_MODAL_COLORS.heading);
  private readonly conditionsHeading = this.makeText(
    'STOP CONDITIONS',
    15,
    SCROLL_MODAL_COLORS.heading,
  );
  private readonly summary = this.makeText('', 14);
  private readonly cost = this.makeText('', 14);
  private readonly error = this.makeText('', 13, 0x9b2525);
  private readonly lossLimitText = this.makeText('', 14);
  private readonly winLimitText = this.makeText('', 14);
  private readonly lossLabel = this.makeText('LOSS LIMIT', 12);
  private readonly winLabel = this.makeText('WIN LIMIT', 12);
  private readonly counts: ModalButton[];
  private readonly bonusToggle: ModalToggle;
  private readonly winToggle: ModalToggle;
  private readonly lossToggle: ModalToggle;
  private readonly winLimitToggle: ModalToggle;
  private readonly lossDecrease: ModalButton;
  private readonly lossIncrease: ModalButton;
  private readonly winDecrease: ModalButton;
  private readonly winIncrease: ModalButton;
  private readonly startButton: ModalButton;
  private readonly stopObserving: IReactionDisposer;
  private viewportWidth = 0;
  private viewportHeight = 0;
  private landscapeLayout = false;

  constructor(store: SlotStore, onStart: () => AutoPlayStartResult) {
    super();
    this.store = store;
    this.onStart = onStart;
    this.label = 'auto-play-modal';
    this.visible = false;
    this.eventMode = 'none';

    this.backdrop.eventMode = 'static';
    this.backdrop.on('pointertap', () => this.close());
    this.counts = AUTO_PLAY_COUNTS.map(
      (count) => new ModalButton(String(count), () => store.autoPlay.selectSpins(count), true),
    );
    this.bonusToggle = new ModalToggle('Stop on Free Spins', () =>
      store.autoPlay.setStopOnFreeSpins(!store.autoPlay.stopOnFreeSpins),
    );
    this.winToggle = new ModalToggle('Stop after any win', () =>
      store.autoPlay.setStopOnWin(!store.autoPlay.stopOnWin),
    );
    this.lossToggle = new ModalToggle('Stop at net loss limit', () => this.toggleLimit('loss'));
    this.winLimitToggle = new ModalToggle('Stop at net win limit', () => this.toggleLimit('win'));
    this.lossDecrease = new ModalButton('-', () => this.adjustLimit('loss', -1));
    this.lossIncrease = new ModalButton('+', () => this.adjustLimit('loss', 1));
    this.winDecrease = new ModalButton('-', () => this.adjustLimit('win', -1));
    this.winIncrease = new ModalButton('+', () => this.adjustLimit('win', 1));
    this.startButton = new ModalButton('START AUTO PLAY', () => this.start());

    this.addChild(this.backdrop, this.content);
    this.content.addChild(
      this.card,
      this.title,
      this.subtitle,
      this.spinHeading,
      ...this.counts,
      this.conditionsHeading,
      this.bonusToggle,
      this.winToggle,
      this.lossToggle,
      this.lossLabel,
      this.lossDecrease,
      this.lossLimitText,
      this.lossIncrease,
      this.winLimitToggle,
      this.winLabel,
      this.winDecrease,
      this.winLimitText,
      this.winIncrease,
      this.summary,
      this.cost,
      this.startButton,
      this.error,
      this.closeButton,
    );

    this.stopObserving = autorun(() => {
      const { autoPlay, panel } = this.store;
      this.counts.forEach((button, index) =>
        button.setSelected(AUTO_PLAY_COUNTS[index] === autoPlay.selectedSpins),
      );
      this.bonusToggle.setChecked(autoPlay.stopOnFreeSpins);
      this.winToggle.setChecked(autoPlay.stopOnWin);
      this.lossToggle.setChecked(autoPlay.netLossLimitCoins !== null);
      this.winLimitToggle.setChecked(autoPlay.netWinLimitCoins !== null);
      this.lossLimitText.text = autoPlay.netLossLimitCoins?.toString() ?? 'OFF';
      this.winLimitText.text = autoPlay.netWinLimitCoins?.toString() ?? 'OFF';
      this.updateSummary(panel.bet, panel.level, panel.coinValueCents);
    });
  }

  open(): boolean {
    if (!this.store.autoPlay.openConfig()) return false;
    this.error.text = '';
    this.visible = true;
    this.eventMode = 'static';
    this.layout();
    return true;
  }

  close(): void {
    this.visible = false;
    this.eventMode = 'none';
    this.store.autoPlay.closeConfig();
  }

  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.layout();
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.stopObserving();
    super.destroy(options);
  }

  private start(): void {
    const result = this.onStart();
    if (result === 'started') {
      this.close();
    } else {
      this.error.text =
        result === 'insufficientBalance'
          ? 'Not enough coins for this bet'
          : 'Auto play is unavailable';
    }
  }

  private toggleLimit(type: 'loss' | 'win'): void {
    const { autoPlay, panel } = this.store;
    const step = Math.max(1, panel.totalBetCoins);
    if (type === 'loss') {
      autoPlay.setNetLossLimitCoins(autoPlay.netLossLimitCoins === null ? step * 10 : null);
    } else {
      autoPlay.setNetWinLimitCoins(autoPlay.netWinLimitCoins === null ? step * 10 : null);
    }
  }

  private adjustLimit(type: 'loss' | 'win', direction: number): void {
    const { autoPlay, panel } = this.store;
    const step = Math.max(1, panel.totalBetCoins);
    const current = type === 'loss' ? autoPlay.netLossLimitCoins : autoPlay.netWinLimitCoins;
    const next = Math.max(step, (current ?? step * 10) + step * direction);
    if (type === 'loss') autoPlay.setNetLossLimitCoins(next);
    else autoPlay.setNetWinLimitCoins(next);
  }

  private layout(): void {
    if (this.viewportWidth <= 0 || this.viewportHeight <= 0) return;
    this.backdrop
      .clear()
      .rect(0, 0, this.viewportWidth, this.viewportHeight)
      .fill({ color: 0x08040e, alpha: 0.78 });
    this.backdrop.hitArea = new Rectangle(0, 0, this.viewportWidth, this.viewportHeight);

    this.landscapeLayout =
      this.viewportHeight < 460 && this.viewportWidth > this.viewportHeight * 1.2;
    const cardHeight = this.landscapeLayout ? 315 : CARD_HEIGHT;
    const width = Math.min(
      this.landscapeLayout ? 760 : CARD_MAX_WIDTH,
      this.viewportWidth - SIDE_MARGIN * 2,
    );
    const scale = Math.min(1, (this.viewportHeight - SIDE_MARGIN * 2) / cardHeight);
    this.content.scale.set(scale);
    this.content.position.set(
      (this.viewportWidth - width * scale) / 2,
      (this.viewportHeight - cardHeight * scale) / 2,
    );
    this.card.resize(width, cardHeight);
    this.closeButton.position.set(width - CONTENT_PADDING_X, this.landscapeLayout ? 35 : 40);
    this.updateSummary(
      this.store.panel.bet,
      this.store.panel.level,
      this.store.panel.coinValueCents,
    );
    if (this.landscapeLayout) {
      this.layoutLandscape(width);
      return;
    }

    this.title.position.set(CONTENT_PADDING_X, 40);
    this.subtitle.position.set(CONTENT_PADDING_X, 66);
    this.spinHeading.position.set(CONTENT_PADDING_X, 95);
    const choiceWidth = (width - CONTENT_PADDING_X * 2 - 24) / 4;
    this.counts.forEach((button, index) => {
      button.resize(choiceWidth, 40);
      button.position.set(CONTENT_PADDING_X + choiceWidth / 2 + index * (choiceWidth + 8), 132);
    });
    this.conditionsHeading.position.set(CONTENT_PADDING_X, 188);
    for (const [toggle, y] of [
      [this.bonusToggle, 222],
      [this.winToggle, 257],
      [this.lossToggle, 292],
      [this.winLimitToggle, 369],
    ] as const) {
      toggle.position.set(CONTENT_PADDING_X, y);
      toggle.resize(width - CONTENT_PADDING_X * 2);
    }
    this.layoutLimit(
      this.lossLabel,
      this.lossDecrease,
      this.lossLimitText,
      this.lossIncrease,
      329,
      width,
    );
    this.layoutLimit(
      this.winLabel,
      this.winDecrease,
      this.winLimitText,
      this.winIncrease,
      406,
      width,
    );
    this.summary.position.set(CONTENT_PADDING_X, 448);
    this.cost.position.set(CONTENT_PADDING_X, 469);
    this.startButton.resize(width - CONTENT_PADDING_X * 2, 43);
    this.startButton.position.set(width / 2, 506);
    this.error.anchor.set(0.5, 0);
    this.error.position.set(width / 2, 535);
  }

  private layoutLandscape(width: number): void {
    const columnGap = 32;
    const leftWidth = (width - CONTENT_PADDING_X * 2 - columnGap) / 2;
    const rightX = CONTENT_PADDING_X + leftWidth + columnGap;
    const choiceWidth = (leftWidth - 8) / 2;

    this.title.position.set(CONTENT_PADDING_X, 35);
    this.subtitle.position.set(CONTENT_PADDING_X, 59);
    this.spinHeading.position.set(CONTENT_PADDING_X, 84);
    this.counts.forEach((button, index) => {
      button.resize(choiceWidth, 34);
      button.position.set(
        CONTENT_PADDING_X + choiceWidth / 2 + (index % 2) * (choiceWidth + 8),
        102 + Math.floor(index / 2) * 39,
      );
    });
    this.conditionsHeading.position.set(rightX, 84);
    for (const [toggle, y] of [
      [this.bonusToggle, 111],
      [this.winToggle, 141],
      [this.lossToggle, 171],
      [this.winLimitToggle, 233],
    ] as const) {
      toggle.position.set(rightX, y);
      toggle.resize(width - rightX - CONTENT_PADDING_X);
    }
    this.layoutLimit(
      this.lossLabel,
      this.lossDecrease,
      this.lossLimitText,
      this.lossIncrease,
      199,
      width,
      rightX,
    );
    this.layoutLimit(
      this.winLabel,
      this.winDecrease,
      this.winLimitText,
      this.winIncrease,
      261,
      width,
      rightX,
    );
    this.summary.position.set(CONTENT_PADDING_X, 190);
    this.cost.position.set(CONTENT_PADDING_X, 213);
    this.startButton.resize(leftWidth, 40);
    this.startButton.position.set(CONTENT_PADDING_X + leftWidth / 2, 258);
    this.error.anchor.set(0.5, 0);
    this.error.position.set(CONTENT_PADDING_X + leftWidth / 2, 283);
  }

  private layoutLimit(
    label: Text,
    decrease: ModalButton,
    value: Text,
    increase: ModalButton,
    y: number,
    width: number,
    left = CONTENT_PADDING_X,
  ): void {
    label.position.set(left, y);
    decrease.resize(29, 26);
    increase.resize(29, 26);
    decrease.position.set(width - CONTENT_PADDING_X - 103, y + 2);
    value.anchor.set(0.5, 0);
    value.position.set(width - CONTENT_PADDING_X - 59, y - 8);
    increase.position.set(width - CONTENT_PADDING_X - 15, y + 2);
  }

  private updateSummary(bet: number, level: number, coinValueCents: number): void {
    const totalCoins = bet * level;
    if (this.landscapeLayout) {
      this.summary.text = `BET ${bet}  |  LEVEL ${level}`;
      this.cost.text = `COIN ${(coinValueCents / 100).toFixed(2)}  |  ${totalCoins} COINS`;
    } else if (this.viewportWidth < 420) {
      this.summary.text = `BET ${bet}  |  LV ${level}  |  CV ${(coinValueCents / 100).toFixed(2)}`;
      this.cost.text = `${totalCoins} COINS  |  ${((totalCoins * coinValueCents) / 100).toFixed(2)} / SPIN`;
    } else {
      this.summary.text = `BET ${bet}  |  LEVEL ${level}  |  COIN ${(coinValueCents / 100).toFixed(2)}`;
      this.cost.text = `${totalCoins} COINS / SPIN  |  ${((totalCoins * coinValueCents) / 100).toFixed(2)}`;
    }
  }

  private makeText(text: string, fontSize: number, fill: number = SCROLL_MODAL_COLORS.ink): Text {
    return new Text({
      text,
      style: { fontFamily: 'Manrope Variable, sans-serif', fontSize, fill },
      anchor: { x: 0, y: 0.5 },
    });
  }
}
