import { supportsAnticipationDemo, WIN_DEMO_TYPES } from '@lucky-games/contracts';
import { Container } from 'pixi.js';
import type { SlotStore } from '../../../stores/SlotStore';
import { SCROLL_MODAL_COLORS } from '../shared/scroll-modal-theme';
import { ScrollModalCheckbox } from '../shared/ScrollModalCheckbox';
import { WinDemoPicker } from './WinDemoPicker';
import { settingsText } from './settings-text';

export class DemoSettingsSection extends Container {
  private readonly store: SlotStore;
  private readonly heading = settingsText('DEMO SETTINGS', 15, SCROLL_MODAL_COLORS.heading);
  private readonly anticipation = new ScrollModalCheckbox('ANTICIPATION DEMO', () => {
    if (this.store.canToggleSpinSettings) {
      this.store.demoSettings.toggleAnticipation(this.store.spinSettings.spinMode);
    }
  });
  private readonly anticipationDescription = settingsText(
    'Creates two visible Scarabs before a later reel. Changes demo odds.',
    13,
    SCROLL_MODAL_COLORS.ink,
    true,
  );
  private readonly winCombination = new ScrollModalCheckbox('WIN COMBINATION DEMO', () => {
    if (this.store.canToggleSpinSettings) this.store.demoSettings.toggleWinCombination();
  });
  private readonly winPicker: WinDemoPicker;
  private readonly winTypeHeading = settingsText(
    'WIN CATEGORY DEMO',
    15,
    SCROLL_MODAL_COLORS.heading,
  );
  private readonly winTypeDescription = settingsText(
    'The server calculates a spin in the selected win category.',
    13,
    SCROLL_MODAL_COLORS.ink,
    true,
  );
  private readonly winTypes: ScrollModalCheckbox[];

  constructor(store: SlotStore) {
    super();
    this.store = store;
    this.winPicker = new WinDemoPicker({
      previousSymbol: () => store.demoSettings.cycleWinDemoSymbol(-1),
      nextSymbol: () => store.demoSettings.cycleWinDemoSymbol(1),
      previousCount: () => store.demoSettings.cycleWinDemoCount(-1),
      nextCount: () => store.demoSettings.cycleWinDemoCount(1),
    });
    this.winTypes = WIN_DEMO_TYPES.map(
      (winType) =>
        new ScrollModalCheckbox(winType.replaceAll('_', ' '), () => {
          if (store.canToggleSpinSettings) store.demoSettings.selectWinType(winType);
        }),
    );

    this.heading.anchor.set(0, 0.5);
    this.winTypeHeading.anchor.set(0, 0.5);
    this.addChild(
      this.heading,
      this.anticipation,
      this.anticipationDescription,
      this.winCombination,
      this.winPicker,
      this.winTypeHeading,
      this.winTypeDescription,
      ...this.winTypes,
    );
  }

  update(): void {
    const { spinSettings, demoSettings, canToggleSpinSettings } = this.store;
    this.anticipation.setState(
      demoSettings.anticipationEnabled,
      canToggleSpinSettings && supportsAnticipationDemo(spinSettings.spinMode),
    );
    this.winCombination.setState(demoSettings.winDemoEnabled, canToggleSpinSettings);
    this.winPicker.setState(
      demoSettings.winDemoSymbol,
      demoSettings.winDemoCount,
      demoSettings.winDemoEnabled && canToggleSpinSettings,
    );
    this.winTypes.forEach((option, index) => {
      option.setState(demoSettings.winTypeDemo === WIN_DEMO_TYPES[index], canToggleSpinSettings);
    });
  }

  layout(wide: boolean, width: number): void {
    this.anticipationDescription.style.wordWrapWidth = width - 28;
    this.winTypeDescription.style.wordWrapWidth = width;
    this.anticipation.resize(width);
    this.winCombination.resize(width);
    this.winPicker.resize(width);

    this.heading.position.set(0, 0);
    this.anticipation.position.set(0, wide ? 39 : 31);
    this.anticipationDescription.position.set(28, wide ? 60 : 52);
    this.winCombination.position.set(0, wide ? 145 : 117);
    this.winPicker.position.set(0, wide ? 178 : 143);
    this.winTypeHeading.position.set(0, wide ? 289 : 235);
    this.winTypeDescription.position.set(0, wide ? 315 : 259);
    this.winTypes.forEach((option, index) => {
      const optionWidth = wide ? width : width / 2;
      option.position.set(
        wide ? 0 : (index % 2) * optionWidth,
        wide ? 381 + index * 38 : 316 + Math.floor(index / 2) * 36,
      );
      option.resize(optionWidth);
    });
  }
}
