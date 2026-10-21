import { Sprite, Texture } from 'pixi.js'
import { EgyptImageAssetKey } from '../../assets'

export class RightBackground extends Sprite {
  constructor(height: number) {
    super(Texture.from(EgyptImageAssetKey.buttons.panelBackground))

    this.label = 'bet-panel-right-background'
    this.anchor.set(0.5)
    this.height = height * 0.15
    this.width = this.height * (this.texture.width / this.texture.height)
  }
}
