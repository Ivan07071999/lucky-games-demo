import { Container, Sprite } from 'pixi.js'
import type { GameContext } from '../runtime/GameContext'

export class MainScene extends Container {
  readonly gameContext: GameContext
  private readonly background: Sprite

  constructor(gameContext: GameContext) {
    super()
    this.gameContext = gameContext
    const texture = gameContext.controllers.assets.loader.getImage('scene', 'background')
    this.background = new Sprite(texture)
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
