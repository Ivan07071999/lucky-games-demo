import { EgyptImageAssetKey } from '../../../assets';
import { IconButton } from './icon-button';

export class InfoButton extends IconButton {
  constructor(onPress: () => void) {
    super('game-info-button', EgyptImageAssetKey.popups.info, onPress, 0.2);
  }
}
