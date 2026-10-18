import { Container, Sprite, type Texture } from 'pixi.js'

export class MainScene extends Container {
  private readonly background: Sprite

  constructor(backgroundTexture: Texture) {
    super()
    this.background = new Sprite(backgroundTexture)
    this.background.anchor.set(0.5)
    this.addChild(this.background)
  }

  resize(width: number, height: number): void {
    const texture = this.background.texture
    const scale = Math.max(width / texture.width, height / texture.height)
    this.background.scale.set(scale)
    this.background.position.set(width / 2, height / 2)
  }
}
