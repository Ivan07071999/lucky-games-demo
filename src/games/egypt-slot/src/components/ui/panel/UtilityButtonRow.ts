import { Container } from 'pixi.js';
import type { AudioToggle } from '../actions/audio-toggle';
import type { InfoButton } from '../actions/info-button';
import type { SettingsButton } from '../actions/settings-button';
import { UTILITY_ICON_SPACING } from './bet-panel-layout';

export class UtilityButtonRow extends Container {
  constructor(info: InfoButton, settings: SettingsButton, audio: AudioToggle) {
    super();
    this.label = 'bet-panel-utility-buttons';

    info.position.set(0, 0);
    settings.position.set(UTILITY_ICON_SPACING, 0);
    audio.position.set(UTILITY_ICON_SPACING * 2, 0);
    this.addChild(settings, audio, info);
  }
}
