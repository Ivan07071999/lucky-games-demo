import { Container, Sprite, type Texture } from 'pixi.js'

export class ReelsMachine extends Container {
  readonly frameBackground: Sprite

  constructor(reelFrameFilledTexture: Texture) {
    super()

    this.frameBackground = new Sprite(reelFrameFilledTexture)
    this.frameBackground.label = 'reel-frame-filled-background'
    this.addChild(this.frameBackground)

    this.pivot.set(reelFrameFilledTexture.width / 2, reelFrameFilledTexture.height / 2)
    this.scale.set(0.5)
  }
}
