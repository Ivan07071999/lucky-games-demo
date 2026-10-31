import { EgyptImageAssetKey } from '../../../assets';
import { IconButton } from './icon-button';

export class SettingsButton extends IconButton {
  constructor(onPress: () => void) {
    super('game-settings-button', EgyptImageAssetKey.buttons.settings, onPress);
  }
}
