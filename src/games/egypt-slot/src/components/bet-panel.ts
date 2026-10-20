import { Container, Sprite, Texture } from 'pixi.js'
import { EgyptImageAssetKey } from '../assets'
import { SpinButton } from './ui/spin-button'

export class BetPanel extends Container {
  readonly spinButton: SpinButton
  readonly leftBackground: Sprite
  readonly rightBackground: Sprite
  readonly leftButton: Sprite
  readonly rightButton: Sprite

  constructor(width: number, height: number, onSpin?: () => void) {
    super()

    this.label = 'bet-panel'
    this.spinButton = new SpinButton(52, onSpin)
    this.leftBackground = this.createPanelBackground('left', height)
    this.rightBackground = this.createPanelBackground('right', height)
    this.leftButton = this.createButton(
      EgyptImageAssetKey.buttons.left,
      'bet-panel-left-button',
      width,
      height,
    )
    this.rightButton = this.createButton(
      EgyptImageAssetKey.buttons.right,
      'bet-panel-right-button',
      width,
      height,
    )

    const buttonGap = 8
    const sideButtonOffset = this.spinButton.width / 2 + this.leftButton.width / 2 + buttonGap
    const backgroundOffset =
      sideButtonOffset + this.leftButton.width / 2 + buttonGap + this.leftBackground.width / 2
    this.leftBackground.position.set(-backgroundOffset, 10)
    this.rightBackground.position.set(backgroundOffset, 10)
    this.leftButton.position.set(-sideButtonOffset, 0)
    this.rightButton.position.set(sideButtonOffset, 0)
    this.spinButton.position.set(0, -20)

    this.addChild(
      this.leftBackground,
      this.leftButton,
      this.spinButton,
      this.rightButton,
      this.rightBackground,
    )
  }

  private createPanelBackground(side: 'left' | 'right', height: number): Sprite {
    const background = new Sprite(Texture.from(EgyptImageAssetKey.buttons.panelBackground))
    background.label = `bet-panel-${side}-background`
    background.anchor.set(0.5)
    background.height = height * 0.15
    background.width = background.height * (background.texture.width / background.texture.height)

    return background
  }

  private createButton(textureKey: string, label: string, width: number, height: number): Sprite {
    const button = new Sprite(Texture.from(textureKey))
    button.label = label
    button.anchor.set(0.5)
    button.width = width * 0.1
    button.height = height * 0.12

    return button
  }
}
