import { Container } from 'pixi.js';
import type { AudioToggle } from '../actions/audio-toggle';
import type { InfoButton } from '../actions/info-button';
import type { SettingsButton } from '../actions/settings-button';

const ICON_SPACING = 44;

export class UtilityButtonRow extends Container {
  constructor(info: InfoButton, settings: SettingsButton, audio: AudioToggle) {
    super();
    this.label = 'bet-panel-utility-buttons';

    info.position.set(0, 0);
    settings.position.set(ICON_SPACING, 0);
    audio.position.set(ICON_SPACING * 2, 0);
    this.addChild(settings, audio, info);
  }
}
