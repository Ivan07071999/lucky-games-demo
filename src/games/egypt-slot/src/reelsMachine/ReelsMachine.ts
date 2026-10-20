import { Container, Sprite, Texture } from 'pixi.js'
import { EgyptImageAssetKey } from '../assets'

export class ReelsMachine extends Container {
  constructor() {
    super()

    const background = this.addBackground()
    const logo = this.addLogo()

    logo.anchor.set(0.5, 0)
    logo.position.x = background.width / 2

    this.addChild(background, logo)

    const bounds = this.getLocalBounds()
    this.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2.2)
  }

  private addBackground(): Sprite {
    const reelFrameFilledTexture = Texture.from(EgyptImageAssetKey.scene.reelFrameFilled)
    const frameBackground = new Sprite(reelFrameFilledTexture)
    frameBackground.label = 'reel-frame-filled-background'
    frameBackground.scale.set(0.55)

    return frameBackground
  }

  private addLogo(): Sprite {
    const logoFrameTexture = Texture.from(EgyptImageAssetKey.scene.logoLong)
    const frameLogo = new Sprite(logoFrameTexture)
    frameLogo.label = 'logo-frame'
    frameLogo.scale.set(0.25)
    return frameLogo
  }
}
