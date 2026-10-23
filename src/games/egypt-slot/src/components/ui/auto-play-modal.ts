import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { autorun, type IReactionDisposer } from 'mobx';
import type { AutoPlayStartResult } from '../../controllers/auto-play-controller/AutoPlayController';
import { AUTO_PLAY_COUNTS } from '../../stores/AutoPlayStore';
import type { SlotStore } from '../../stores/SlotStore';

const CARD_HEIGHT = 550;
const CARD_MAX_WIDTH = 520;
const SIDE_MARGIN = 12;

class ModalButton extends Container {
  private readonly background = new Graphics();
  private readonly caption: Text;
  private buttonWidth = 0;
  private buttonHeight = 0;
  private selected = false;
  private hovered = false;

  constructor(label: string, onPress: () => void) {
    super();
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.caption = new Text({
      text: label,
      style: { fontFamily: 'Manrope Variable, sans-serif', fontSize: 15, fill: 0xffedc8 },
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
    const fill = this.selected ? 0x956019 : this.hovered ? 0x572348 : 0x32152f;
    this.background
      .clear()
      .roundRect(
        -this.buttonWidth / 2,
        -this.buttonHeight / 2,
        this.buttonWidth,
        this.buttonHeight,
        9,
      )
      .fill({ color: fill, alpha: 0.98 })
      .stroke({ color: this.selected ? 0xffde8e : 0xb88144, width: this.selected ? 2 : 1 });
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
      style: { fontFamily: 'Manrope Variable, sans-serif', fontSize: 15, fill: 0xffedc8 },
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
    this.mark.clear().circle(10, 0, 9).stroke({ color: 0xe0ae5a, width: 1.5 });
    if (this.checked) this.mark.circle(10, 0, 5).fill(0xffdf8b);
  }
}

export class AutoPlayModal extends Container {
  private readonly store: SlotStore;
  private readonly onStart: () => AutoPlayStartResult;
  private readonly backdrop = new Graphics();
  private readonly content = new Container();
  private readonly card = new Graphics();
  private readonly title = this.makeText('AUTO PLAY', 24, 0xffe3a1);
  private readonly subtitle = this.makeText('Automatic spins with the current bet', 12);
  private readonly spinHeading = this.makeText('NUMBER OF SPINS', 15, 0xffe3a1);
  private readonly conditionsHeading = this.makeText('STOP CONDITIONS', 15, 0xffe3a1);
  private readonly summary = this.makeText('', 14);
  private readonly cost = this.makeText('', 14);
  private readonly error = this.makeText('', 13, 0xffa5a5);
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
    this.card.eventMode = 'static';
    this.counts = AUTO_PLAY_COUNTS.map(
      (count) => new ModalButton(String(count), () => store.autoPlay.selectSpins(count)),
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
    const cardHeight = this.landscapeLayout ? 296 : CARD_HEIGHT;
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
    this.card
      .clear()
      .roundRect(0, 0, width, cardHeight, 18)
      .fill({ color: 0x211126, alpha: 0.99 })
      .stroke({ color: 0xd69838, width: 2 });
    this.card.hitArea = new Rectangle(0, 0, width, cardHeight);
    this.updateSummary(
      this.store.panel.bet,
      this.store.panel.level,
      this.store.panel.coinValueCents,
    );
    if (this.landscapeLayout) {
      this.layoutLandscape(width);
      return;
    }

    this.title.position.set(18, 30);
    this.subtitle.position.set(18, 56);
    this.spinHeading.position.set(18, 85);
    const choiceWidth = (width - 36 - 24) / 4;
    this.counts.forEach((button, index) => {
      button.resize(choiceWidth, 40);
      button.position.set(18 + choiceWidth / 2 + index * (choiceWidth + 8), 122);
    });
    this.conditionsHeading.position.set(18, 178);
    for (const [toggle, y] of [
      [this.bonusToggle, 212],
      [this.winToggle, 247],
      [this.lossToggle, 282],
      [this.winLimitToggle, 359],
    ] as const) {
      toggle.position.set(18, y);
      toggle.resize(width - 36);
    }
    this.layoutLimit(
      this.lossLabel,
      this.lossDecrease,
      this.lossLimitText,
      this.lossIncrease,
      319,
      width,
    );
    this.layoutLimit(
      this.winLabel,
      this.winDecrease,
      this.winLimitText,
      this.winIncrease,
      396,
      width,
    );
    this.summary.position.set(18, 438);
    this.cost.position.set(18, 459);
    this.startButton.resize(width - 36, 43);
    this.startButton.position.set(width / 2, 496);
    this.error.anchor.set(0.5, 0);
    this.error.position.set(width / 2, 525);
  }

  private layoutLandscape(width: number): void {
    const leftWidth = (width - 54) / 2;
    const rightX = leftWidth + 36;
    const choiceWidth = (leftWidth - 8) / 2;

    this.title.position.set(18, 24);
    this.subtitle.position.set(18, 48);
    this.spinHeading.position.set(18, 73);
    this.counts.forEach((button, index) => {
      button.resize(choiceWidth, 34);
      button.position.set(
        18 + choiceWidth / 2 + (index % 2) * (choiceWidth + 8),
        102 + Math.floor(index / 2) * 39,
      );
    });
    this.conditionsHeading.position.set(rightX, 73);
    for (const [toggle, y] of [
      [this.bonusToggle, 100],
      [this.winToggle, 130],
      [this.lossToggle, 160],
      [this.winLimitToggle, 222],
    ] as const) {
      toggle.position.set(rightX, y);
      toggle.resize(width - rightX - 18);
    }
    this.layoutLimit(
      this.lossLabel,
      this.lossDecrease,
      this.lossLimitText,
      this.lossIncrease,
      188,
      width,
      rightX,
    );
    this.layoutLimit(
      this.winLabel,
      this.winDecrease,
      this.winLimitText,
      this.winIncrease,
      250,
      width,
      rightX,
    );
    this.summary.position.set(18, 179);
    this.cost.position.set(18, 202);
    this.startButton.resize(leftWidth, 40);
    this.startButton.position.set(18 + leftWidth / 2, 247);
    this.error.anchor.set(0.5, 0);
    this.error.position.set(18 + leftWidth / 2, 272);
  }

  private layoutLimit(
    label: Text,
    decrease: ModalButton,
    value: Text,
    increase: ModalButton,
    y: number,
    width: number,
    left = 18,
  ): void {
    label.position.set(left, y);
    decrease.resize(29, 26);
    increase.resize(29, 26);
    decrease.position.set(width - 123, y + 2);
    value.anchor.set(0.5, 0);
    value.position.set(width - 79, y - 8);
    increase.position.set(width - 35, y + 2);
  }

  private updateSummary(bet: number, level: number, coinValueCents: number): void {
    const totalCoins = bet * level;
    if (this.landscapeLayout) {
      this.summary.text = `BET ${bet}  |  LEVEL ${level}`;
      this.cost.text = `COIN ${(coinValueCents / 100).toFixed(2)}  |  ${totalCoins} COINS`;
    } else {
      this.summary.text = `BET ${bet}  |  LEVEL ${level}  |  COIN ${(coinValueCents / 100).toFixed(2)}`;
      this.cost.text = `${totalCoins} COINS / SPIN  |  ${((totalCoins * coinValueCents) / 100).toFixed(2)}`;
    }
  }

  private makeText(text: string, fontSize: number, fill = 0xfff3dc): Text {
    return new Text({
      text,
      style: { fontFamily: 'Manrope Variable, sans-serif', fontSize, fill },
      anchor: { x: 0, y: 0.5 },
    });
  }
}
