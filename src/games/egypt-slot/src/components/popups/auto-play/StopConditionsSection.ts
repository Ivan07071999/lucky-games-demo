import { Container, Text } from 'pixi.js';
import type { SlotStore } from '../../../stores/SlotStore';
import { SCROLL_MODAL_COLORS } from '../scroll-modal-theme';
import { AutoPlayButton } from './AutoPlayButton';
import { AutoPlayToggle } from './AutoPlayToggle';
import { makeAutoPlayText } from './auto-play-text';

type LimitType = 'loss' | 'win';

export class StopConditionsSection extends Container {
  private readonly store: SlotStore;
  private readonly heading = makeAutoPlayText('STOP CONDITIONS', 15, SCROLL_MODAL_COLORS.heading);
  private readonly bonusToggle: AutoPlayToggle;
  private readonly winToggle: AutoPlayToggle;
  private readonly lossToggle: AutoPlayToggle;
  private readonly winLimitToggle: AutoPlayToggle;
  private readonly lossLabel = makeAutoPlayText('LOSS LIMIT', 12);
  private readonly winLabel = makeAutoPlayText('WIN LIMIT', 12);
  private readonly lossDecrease: AutoPlayButton;
  private readonly lossIncrease: AutoPlayButton;
  private readonly winDecrease: AutoPlayButton;
  private readonly winIncrease: AutoPlayButton;
  private readonly lossLimitText = makeAutoPlayText('', 14);
  private readonly winLimitText = makeAutoPlayText('', 14);

  constructor(store: SlotStore) {
    super();
    this.store = store;
    this.bonusToggle = new AutoPlayToggle('Stop on Free Spins', () =>
      store.autoPlay.setStopOnFreeSpins(!store.autoPlay.stopOnFreeSpins),
    );
    this.winToggle = new AutoPlayToggle('Stop after any win', () =>
      store.autoPlay.setStopOnWin(!store.autoPlay.stopOnWin),
    );
    this.lossToggle = new AutoPlayToggle('Stop at net loss limit', () => this.toggleLimit('loss'));
    this.winLimitToggle = new AutoPlayToggle('Stop at net win limit', () =>
      this.toggleLimit('win'),
    );
    this.lossDecrease = new AutoPlayButton('-', () => this.adjustLimit('loss', -1));
    this.lossIncrease = new AutoPlayButton('+', () => this.adjustLimit('loss', 1));
    this.winDecrease = new AutoPlayButton('-', () => this.adjustLimit('win', -1));
    this.winIncrease = new AutoPlayButton('+', () => this.adjustLimit('win', 1));
    this.addChild(
      this.heading,
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
    );
  }

  update(): void {
    const { autoPlay } = this.store;
    this.bonusToggle.setChecked(autoPlay.stopOnFreeSpins);
    this.winToggle.setChecked(autoPlay.stopOnWin);
    this.lossToggle.setChecked(autoPlay.netLossLimitCoins !== null);
    this.winLimitToggle.setChecked(autoPlay.netWinLimitCoins !== null);
    this.lossLimitText.text = autoPlay.netLossLimitCoins?.toString() ?? 'OFF';
    this.winLimitText.text = autoPlay.netWinLimitCoins?.toString() ?? 'OFF';
  }

  layoutPortrait(width: number, padding: number, lowerOffset: number): void {
    this.position.set(padding, 188 + lowerOffset);
    const availableWidth = width - padding * 2;
    for (const [toggle, y] of [
      [this.bonusToggle, 34],
      [this.winToggle, 69],
      [this.lossToggle, 104],
      [this.winLimitToggle, 181],
    ] as const) {
      toggle.position.set(0, y);
      toggle.resize(availableWidth);
    }
    this.layoutLimit(
      this.lossLabel,
      this.lossDecrease,
      this.lossLimitText,
      this.lossIncrease,
      141,
      availableWidth,
    );
    this.layoutLimit(
      this.winLabel,
      this.winDecrease,
      this.winLimitText,
      this.winIncrease,
      218,
      availableWidth,
    );
  }

  layoutLandscape(width: number, rightX: number, padding: number): void {
    this.position.set(rightX, 84);
    const availableWidth = width - rightX - padding;
    for (const [toggle, y] of [
      [this.bonusToggle, 27],
      [this.winToggle, 57],
      [this.lossToggle, 87],
      [this.winLimitToggle, 149],
    ] as const) {
      toggle.position.set(0, y);
      toggle.resize(availableWidth);
    }
    this.layoutLimit(
      this.lossLabel,
      this.lossDecrease,
      this.lossLimitText,
      this.lossIncrease,
      115,
      availableWidth,
    );
    this.layoutLimit(
      this.winLabel,
      this.winDecrease,
      this.winLimitText,
      this.winIncrease,
      177,
      availableWidth,
    );
  }

  private layoutLimit(
    label: Text,
    decrease: AutoPlayButton,
    value: Text,
    increase: AutoPlayButton,
    y: number,
    width: number,
  ): void {
    label.position.set(0, y);
    decrease.resize(29, 26);
    increase.resize(29, 26);
    decrease.position.set(width - 103, y + 2);
    value.anchor.set(0.5, 0);
    value.position.set(width - 59, y - 8);
    increase.position.set(width - 15, y + 2);
  }

  private toggleLimit(type: LimitType): void {
    const { autoPlay, panel } = this.store;
    const step = Math.max(1, panel.totalBetCoins);
    if (type === 'loss') {
      autoPlay.setNetLossLimitCoins(autoPlay.netLossLimitCoins === null ? step * 10 : null);
    } else {
      autoPlay.setNetWinLimitCoins(autoPlay.netWinLimitCoins === null ? step * 10 : null);
    }
  }

  private adjustLimit(type: LimitType, direction: number): void {
    const { autoPlay, panel } = this.store;
    const step = Math.max(1, panel.totalBetCoins);
    const current = type === 'loss' ? autoPlay.netLossLimitCoins : autoPlay.netWinLimitCoins;
    const next = Math.max(step, (current ?? step * 10) + step * direction);
    if (type === 'loss') autoPlay.setNetLossLimitCoins(next);
    else autoPlay.setNetWinLimitCoins(next);
  }
}
