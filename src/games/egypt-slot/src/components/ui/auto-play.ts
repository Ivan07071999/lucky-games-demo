import { EgyptImageAssetKey } from '../../assets'
import { BetActionButton } from './bet-action-button'

export class AutoPlayButton extends BetActionButton {
  constructor(width: number, height: number) {
    super(width, height, {
      texture: EgyptImageAssetKey.buttons.left,
      label: 'bet-panel-left-button',
      textLabel: 'auto-play-label',
      text: 'AUTO\nPLAY',
    })
  }
}
