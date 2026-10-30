import { Container } from 'pixi.js';
import { autorun, type IReactionDisposer } from 'mobx';
import { SlotStore } from '../stores/SlotStore';
import type { SceneTheme } from '../scene/sceneTheme';
import { AutoPlayButton } from './ui/auto-play';
import { AudioToggle } from './ui/audio-toggle';
import { InfoButton } from './ui/info-button';
import { LeftBackground } from './ui/left-background';
import { MaxBetButton } from './ui/max-bet';
import { RightBackground } from './ui/right-background';
import { SettingsButton } from './ui/settings-button';
import { SpinButton } from './ui/spin-button';

const SPIN_DIAMETER = 104;
const TOOL_ICON_SPACING = 44;
const TOOL_ICON_SIZE = 28;
const TOOL_ROW_OFFSET = TOOL_ICON_SIZE / 2 + 4;
const COMPACT_PANEL_GAP = 48;
const COMPACT_ACTION_GAP = 16;

export type BetPanelLayout = 'wide' | 'compact';

export class BetPanel extends Container {
  readonly spinButton: SpinButton;
  readonly leftBackground: LeftBackground;
  readonly rightBackground: RightBackground;
  readonly autoPlayButton: AutoPlayButton;
  readonly maxBetButton: MaxBetButton;
  private readonly stopObserving: IReactionDisposer;
  private settingsButton: SettingsButton | null = null;
  private audioToggle: AudioToggle | null = null;
  private infoButton: InfoButton | null = null;

  constructor(
    width: number,
    height: number,
    store: SlotStore,
    onSpinRequested: () => void,
    onBetRequested: () => void,
    onMaxBetRequested: () => void,
    onAutoPlayRequested: () => void,
  ) {
    super();

    const panel = store.panel;
    this.label = 'bet-panel';
    this.spinButton = new SpinButton(SPIN_DIAMETER / 2, onSpinRequested);
    this.leftBackground = new LeftBackground(
      height,
      panel.bet,
      panel.level,
      panel.totalBetCoins,
      {
        onDecrease: panel.decreaseLevel,
        onIncrease: panel.increaseLevel,
      },
      onBetRequested,
    );
    this.rightBackground = new RightBackground(height, store);
    this.autoPlayButton = new AutoPlayButton(width, height, onAutoPlayRequested);
    this.maxBetButton = new MaxBetButton(width, height, onMaxBetRequested);
    this.addChild(
      this.leftBackground,
      this.autoPlayButton,
      this.spinButton,
      this.maxBetButton,
      this.rightBackground,
    );
    this.setLayout('wide');

    this.stopObserving = autorun(() => {
      this.leftBackground.bet.setValue(panel.bet);
      this.leftBackground.bet.setEnabled(panel.canEditBet);
      this.leftBackground.levelSwitcher.setValue(panel.level);
      this.leftBackground.levelSwitcher.setEnabled(panel.canEditBet);
      this.leftBackground.totalBet.setValue(
        store.round.currentRound?.bet.totalCoins ?? panel.totalBetCoins,
      );
      this.spinButton.setSpinning(store.round.isSpinning);
      const canPressSpin =
        (store.canSpin && (!store.round.isFreeSpin || !!store.round.errorMessage)) ||
        store.round.canQuickStop ||
        store.round.canSkipWin;
      this.spinButton.eventMode = canPressSpin ? 'static' : 'none';
      this.spinButton.alpha = canPressSpin ? 1 : 0.5;
      const canPressMaxBet = store.canRequestMaxBet;
      this.maxBetButton.eventMode = canPressMaxBet ? 'static' : 'none';
      this.maxBetButton.alpha = canPressMaxBet ? 1 : 0.5;
      const autoPlay = store.autoPlay;
      const canStopAutoPlay = autoPlay.isBetLocked && autoPlay.state !== 'stopRequested';
      const canOpenAutoPlay =
        autoPlay.canConfigure &&
        store.round.ready &&
        store.round.stage === 'idle' &&
        !store.round.isFreeSpin &&
        !store.round.errorMessage;
      const canPressAutoPlay = canStopAutoPlay || canOpenAutoPlay;
      this.autoPlayButton.setAutoPlayStatus(
        autoPlay.isBetLocked,
        autoPlay.completed,
        autoPlay.remaining,
      );
      this.autoPlayButton.eventMode = canPressAutoPlay ? 'static' : 'none';
      this.autoPlayButton.alpha = canPressAutoPlay ? 1 : 0.5;
    });
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.stopObserving();
    super.destroy(options);
  }

  setTheme(theme: SceneTheme): void {
    this.leftBackground.setTheme(theme);
    this.rightBackground.setTheme(theme);
  }

  attachUtilityButtons(
    settingsButton: SettingsButton,
    audioToggle: AudioToggle,
    infoButton: InfoButton,
  ): void {
    this.settingsButton = settingsButton;
    this.audioToggle = audioToggle;
    this.infoButton = infoButton;
    this.addChild(settingsButton, audioToggle, infoButton);
    this.positionUtilityButtons();
  }

  setLayout(layout: BetPanelLayout): void {
    const buttonGap = 8;
    const buttonWidth = this.autoPlayButton.background.width;
    const sideButtonOffset = SPIN_DIAMETER / 2 + buttonWidth / 2 + buttonGap;

    if (layout === 'compact') {
      const backgroundHeight = this.leftBackground.background.height;
      const rightBackgroundY = backgroundHeight + COMPACT_PANEL_GAP;
      const actionY =
        rightBackgroundY +
        this.rightBackground.background.height / 2 +
        COMPACT_ACTION_GAP +
        SPIN_DIAMETER / 2;

      this.leftBackground.position.set(0, 0);
      this.rightBackground.position.set(0, rightBackgroundY);
      this.autoPlayButton.position.set(-sideButtonOffset, actionY + 7);
      this.spinButton.position.set(0, actionY);
      this.maxBetButton.position.set(sideButtonOffset, actionY + 7);
      this.positionUtilityButtons();
      return;
    }

    const backgroundInnerEdge = sideButtonOffset + buttonWidth / 2 + buttonGap;
    this.leftBackground.position.set(
      -backgroundInnerEdge - this.leftBackground.background.width / 2,
      10,
    );
    this.rightBackground.position.set(
      backgroundInnerEdge + this.rightBackground.background.width / 2,
      10,
    );
    this.autoPlayButton.position.set(-sideButtonOffset, 0);
    this.maxBetButton.position.set(sideButtonOffset, 0);
    this.spinButton.position.set(0, -20);
    this.positionUtilityButtons();
  }

  private positionUtilityButtons(): void {
    if (!this.settingsButton || !this.audioToggle || !this.infoButton) return;
    const x = this.leftBackground.x - this.leftBackground.background.width / 2 + TOOL_ICON_SIZE / 2;
    const y = this.leftBackground.y + this.leftBackground.background.height / 2 + TOOL_ROW_OFFSET;
    this.infoButton.position.set(x, y);
    this.settingsButton.position.set(x + TOOL_ICON_SPACING, y);
    this.audioToggle.position.set(x + TOOL_ICON_SPACING * 2, y);
  }
}
