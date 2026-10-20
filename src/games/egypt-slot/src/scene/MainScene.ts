import { Container, Sprite } from 'pixi.js'
import { GameContext, type GameMessages } from '../runtime/GameContext'

export class MainScene extends Container {
  readonly context: GameContext
  private background: Sprite | null = null

  constructor(canvas: HTMLCanvasElement, messages: GameMessages) {
    super()
    this.context = new GameContext(canvas, messages)
    this.pivot.set()
  }

  initialize(): void {
    if (this.background) return

    const background = new Sprite(this.context.controllers.assets.getBackground())
    background.anchor.set(0.5)
    this.background = background
    this.addChild(background, this.context.reelsMachine)
  }

  resize(width: number, height: number): void {
    if (!this.background) throw new Error('MainScene has not been initialized')

    const texture = this.background.texture
    const scale = Math.max(width / texture.width, height / texture.height)
    this.background.scale.set(scale)
    this.background.position.set(width / 2, height / 2)
    this.context.reelsMachine.position.set(width / 2, height / 2)
  }
}
