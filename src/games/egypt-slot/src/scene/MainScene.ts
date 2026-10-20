import { Container, Sprite, Texture } from 'pixi.js'
import { EgyptImageAssetKey } from '../assets'
import { BetPanel } from '../components/bet-panel'
import { GameContext, type GameMessages } from '../runtime/GameContext'

export class MainScene extends Container {
  readonly context: GameContext
  private background: Sprite | null = null
  private betPanel: BetPanel | null = null

  constructor(canvas: HTMLCanvasElement, messages: GameMessages) {
    super()
    this.context = new GameContext(canvas, messages)
  }

  initialize(): void {
    if (this.background) return

    const background = new Sprite(Texture.from(EgyptImageAssetKey.scene.background))
    background.anchor.set(0.5)
    this.background = background

    const reelsMachine = this.context.reelsMachine
    this.betPanel = new BetPanel(reelsMachine.width, reelsMachine.height)

    this.addChild(background, reelsMachine, this.betPanel)
  }

  resize(width: number, height: number): void {
    if (!this.background) throw new Error('MainScene has not been initialized')
    if (width <= 0 || height <= 0) return

    const texture = this.background.texture
    const backgroundScale = Math.max(width / texture.width, height / texture.height)
    this.background.scale.set(backgroundScale)
    this.background.position.set(width / 2, height / 2)

    const reelsMachine = this.context.reelsMachine
    reelsMachine.position.set(width / 2, height / 2)

    this.betPanel?.position.set(
      reelsMachine.position.x,
      reelsMachine.position.y + reelsMachine.height - reelsMachine.pivot.y - 40,
    )
  }
}
