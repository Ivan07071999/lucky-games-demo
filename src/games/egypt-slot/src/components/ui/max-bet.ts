import { EgyptImageAssetKey } from '../../assets';
import { BetActionButton } from './bet-action-button';

export class MaxBetButton extends BetActionButton {
  constructor(width: number, height: number, onPress: () => void) {
    super(width, height, {
      texture: EgyptImageAssetKey.buttons.right,
      label: 'bet-panel-right-button',
      textLabel: 'max-bet-label',
      text: 'MAX\nBET',
    });
    this.on('pointertap', onPress);
  }
}
