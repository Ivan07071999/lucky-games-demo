import { PAYLINE_COUNTS } from '@lucky-games/contracts';
import { Container } from 'pixi.js';
import type { SlotStore } from '../../../stores/SlotStore';
import { SCROLL_MODAL_COLORS } from '../scroll-modal-theme';
import { SettingsCheckbox } from './SettingsCheckbox';
import { settingsText } from './settings-text';

export class SpinSettingsSection extends Container {
  private readonly store: SlotStore;
  private readonly heading = settingsText('SPIN SETTINGS', 15, SCROLL_MODAL_COLORS.heading);
  private readonly turbo = new SettingsCheckbox('TURBO SPIN', () => {
    if (this.store.canToggleSpinSettings) this.store.spinSettings.toggleTurbo();
  });
  private readonly turboDescription = settingsText(
    'Turbo stops the reels faster after the server responds.',
    13,
    SCROLL_MODAL_COLORS.ink,
    true,
  );
  private readonly paylineHeading = settingsText('WINNING LINES', 15, SCROLL_MODAL_COLORS.heading);
  private readonly paylines: SettingsCheckbox[];
  private readonly modeHeading = settingsText('REEL MODE', 15, SCROLL_MODAL_COLORS.heading);
  private readonly classic = new SettingsCheckbox('CLASSIC SPIN', () => {
    if (this.store.canToggleSpinSettings) this.store.spinSettings.selectClassic();
  });
  private readonly cascade = new SettingsCheckbox('CASCADE', () => {
    if (this.store.canToggleSpinSettings) this.store.spinSettings.toggleCascade();
  });
  private readonly cascadeDescription = settingsText(
    'Winning symbols disappear and new symbols fall in. Changes payout math.',
    13,
    SCROLL_MODAL_COLORS.ink,
    true,
  );
  private readonly hybrid = new SettingsCheckbox('HYBRID SPIN', () => {
    if (this.store.canToggleSpinSettings) this.store.spinSettings.toggleHybrid();
  });
  private readonly hybridDescription = settingsText(
    'Reels spin normally; winning symbols then disappear and refill from above.',
    13,
    SCROLL_MODAL_COLORS.ink,
    true,
  );

  constructor(store: SlotStore) {
    super();
    this.store = store;
    this.paylines = PAYLINE_COUNTS.map(
      (count) =>
        new SettingsCheckbox(`${count} LINES`, () => {
          if (store.canToggleSpinSettings && (store.gameConfig?.paylines.length ?? 0) >= count) {
            store.spinSettings.setPaylineCount(count);
          }
        }),
    );

    for (const heading of [this.heading, this.paylineHeading, this.modeHeading]) {
      heading.anchor.set(0, 0.5);
    }
    this.addChild(
      this.heading,
      this.turbo,
      this.turboDescription,
      this.paylineHeading,
      ...this.paylines,
      this.modeHeading,
      this.classic,
      this.cascade,
      this.cascadeDescription,
      this.hybrid,
      this.hybridDescription,
    );
  }

  update(): void {
    const { spinSettings, canToggleSpinSettings, gameConfig } = this.store;
    this.turbo.setState(spinSettings.turboEnabled, canToggleSpinSettings);
    this.paylines.forEach((option, index) => {
      const count = PAYLINE_COUNTS[index];
      option.setState(
        spinSettings.paylineCount === count,
        canToggleSpinSettings && (gameConfig?.paylines.length ?? 0) >= count,
      );
    });
    this.classic.setState(spinSettings.classicEnabled, canToggleSpinSettings);
    this.cascade.setState(spinSettings.cascadeEnabled, canToggleSpinSettings);
    this.hybrid.setState(spinSettings.hybridEnabled, canToggleSpinSettings);
  }

  layout(wide: boolean, width: number): void {
    for (const description of [
      this.turboDescription,
      this.cascadeDescription,
      this.hybridDescription,
    ]) {
      description.style.wordWrapWidth = width - 28;
    }
    for (const option of [this.turbo, this.classic, this.cascade, this.hybrid]) {
      option.resize(width);
    }

    this.heading.position.set(0, 0);
    this.turbo.position.set(0, wide ? 39 : 37);
    this.turboDescription.position.set(28, wide ? 60 : 59);
    this.paylineHeading.position.set(0, wide ? 132 : 126);
    this.paylines.forEach((option, index) => {
      const optionWidth = width / PAYLINE_COUNTS.length;
      option.position.set(index * optionWidth, wide ? 173 : 164);
      option.resize(optionWidth);
    });
    this.modeHeading.position.set(0, wide ? 233 : 224);
    this.classic.position.set(0, wide ? 271 : 260);
    this.cascade.position.set(0, wide ? 314 : 302);
    this.cascadeDescription.position.set(28, wide ? 337 : 324);
    this.hybrid.position.set(0, wide ? 406 : 390);
    this.hybridDescription.position.set(28, wide ? 429 : 412);
  }
}
