import { Container } from 'pixi.js';
import { autorun, type IReactionDisposer } from 'mobx';
import type { SlotStore } from '../../../stores/SlotStore';
import type { SceneTheme } from '../../../scene/sceneTheme';
import { AutoPlayButton } from '../actions/auto-play';
import type { AudioToggle } from '../actions/audio-toggle';
import type { InfoButton } from '../actions/info-button';
import { MaxBetButton } from '../actions/max-bet';
import type { SettingsButton } from '../actions/settings-button';
import { SpinButton } from '../actions/spin-button';
import { LeftBackground } from './left-background';
import { RightBackground } from './right-background';
import { UtilityButtonRow } from './UtilityButtonRow';
import { calculateBetPanelPositions, SPIN_DIAMETER, type BetPanelLayout } from './bet-panel-layout';
import { getBetPanelState, type BetPanelState } from './bet-panel-state';

export type { BetPanelLayout } from './bet-panel-layout';

export type BetPanelOptions = {
  width: number;
  height: number;
  store: SlotStore;
  onSpinRequested: () => void;
  onBetRequested: () => void;
  onBetChanged: () => void;
  onMaxBetRequested: () => void;
  onAutoPlayRequested: () => void;
};

export class BetPanel extends Container {
  readonly spinButton: SpinButton;
  readonly leftBackground: LeftBackground;
  readonly rightBackground: RightBackground;
  readonly autoPlayButton: AutoPlayButton;
  readonly maxBetButton: MaxBetButton;
  private readonly stopObserving: IReactionDisposer;
  private utilityButtons: UtilityButtonRow | null = null;
  private layout: BetPanelLayout = 'wide';

  constructor({
    width,
    height,
    store,
    onSpinRequested,
    onBetRequested,
    onBetChanged,
    onMaxBetRequested,
    onAutoPlayRequested,
  }: BetPanelOptions) {
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
        onDecrease: () => {
          const previousLevel = panel.level;
          panel.decreaseLevel();
          if (panel.level !== previousLevel) onBetChanged();
        },
        onIncrease: () => {
          const previousLevel = panel.level;
          panel.increaseLevel();
          if (panel.level !== previousLevel) onBetChanged();
        },
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

    this.stopObserving = autorun(() => this.applyState(getBetPanelState(store)));
  }

  setTheme(theme: SceneTheme): void {
    this.leftBackground.setTheme(theme);
    this.rightBackground.setTheme(theme);
  }

  attachUtilityButtons(info: InfoButton, settings: SettingsButton, audio: AudioToggle): void {
    this.utilityButtons = new UtilityButtonRow(info, settings, audio);
    this.addChild(this.utilityButtons);
    this.setLayout(this.layout);
  }

  setLayout(layout: BetPanelLayout): void {
    this.layout = layout;
    const positions = calculateBetPanelPositions(layout, {
      leftWidth: this.leftBackground.background.width,
      leftHeight: this.leftBackground.background.height,
      rightWidth: this.rightBackground.background.width,
      rightHeight: this.rightBackground.background.height,
      actionWidth: this.autoPlayButton.background.width,
    });

    this.leftBackground.position.set(positions.left.x, positions.left.y);
    this.rightBackground.position.set(positions.right.x, positions.right.y);
    this.autoPlayButton.position.set(positions.autoPlay.x, positions.autoPlay.y);
    this.spinButton.position.set(positions.spin.x, positions.spin.y);
    this.maxBetButton.position.set(positions.maxBet.x, positions.maxBet.y);
    this.utilityButtons?.position.set(positions.utilities.x, positions.utilities.y);
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.stopObserving();
    super.destroy(options);
  }

  private applyState(state: BetPanelState): void {
    const { bet, levelSwitcher, totalBet } = this.leftBackground;
    bet.setValue(state.bet);
    bet.setEnabled(state.canEditBet);
    levelSwitcher.setValue(state.level);
    levelSwitcher.setEnabled(state.canEditBet);
    totalBet.setValue(state.totalBetCoins);

    this.spinButton.setSpinning(state.isSpinning);
    this.setActionEnabled(this.spinButton, state.canPressSpin);
    this.setActionEnabled(this.maxBetButton, state.canPressMaxBet);
    this.autoPlayButton.setAutoPlayStatus(
      state.autoPlayActive,
      state.autoPlayCompleted,
      state.autoPlayRemaining,
    );
    this.setActionEnabled(this.autoPlayButton, state.canPressAutoPlay);
  }

  private setActionEnabled(button: Container, enabled: boolean): void {
    button.eventMode = enabled ? 'static' : 'none';
    button.alpha = enabled ? 1 : 0.5;
  }
}
