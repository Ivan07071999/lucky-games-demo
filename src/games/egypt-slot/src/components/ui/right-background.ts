import { Container, Sprite, Texture } from 'pixi.js'
import { EgyptImageAssetKey } from '../../assets'
import { CoinValueSwitcher } from './coin-value-switcher'
import { Coins } from './coins'

export class RightBackground extends Container {
  readonly background: Sprite
  readonly coinValueSwitcher: CoinValueSwitcher
  readonly coins: Coins

  constructor(height: number) {
    super()

    this.label = 'bet-panel-right-background'
    this.background = new Sprite(Texture.from(EgyptImageAssetKey.buttons.panelBackground))
    this.background.label = 'bet-panel-right-background-image'
    this.background.anchor.set(0.5)
    this.background.height = height * 0.15
    this.background.width =
      this.background.height * (this.background.texture.width / this.background.texture.height)

    this.coinValueSwitcher = new CoinValueSwitcher(this.background.width, this.background.height)
    this.coinValueSwitcher.position.x = -this.background.width * 0.25
    this.coinValueSwitcher.position.y = -10
    this.coins = new Coins(this.background.width, this.background.height)
    this.coins.position.set(this.background.width * 0.2, -10)
    this.addChild(this.background, this.coinValueSwitcher, this.coins)
  }
}
