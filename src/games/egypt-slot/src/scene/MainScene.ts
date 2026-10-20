import { Container, Sprite } from 'pixi.js'
import type { GameContext } from '../runtime/GameContext'

export class MainScene extends Container {
  private readonly background: Sprite

  constructor(context: GameContext) {
    super()
    this.background = new Sprite(context.controllers.assets.getBackground())
    this.background.anchor.set(0.5)
    this.addChild(this.background, context.reelsMachine)
  }

  resize(width: number, height: number): void {
    const texture = this.background.texture
    const scale = Math.max(width / texture.width, height / texture.height)
    this.background.scale.set(scale)
    this.background.position.set(width / 2, height / 2)
  }
}
