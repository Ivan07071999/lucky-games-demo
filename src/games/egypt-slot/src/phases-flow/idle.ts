import type { Application } from 'pixi.js'
import type { GameContext } from '../runtime/GameContext'
import { MainScene } from '../scene/MainScene'
import type { Phase } from './PhaseManager'
import type { EgyptPhase } from './types'

export class IdlePhase implements Phase<EgyptPhase> {
  private readonly context: GameContext
  private application: Application | null = null
  private scene: MainScene | null = null

  constructor(context: GameContext) {
    this.context = context
  }

  private readonly resizeScene = () => {
    if (!this.application || !this.scene) return
    this.scene.resize(this.application.screen.width, this.application.screen.height)
  }

  enter(): null {
    const application = this.context.controllers.application.current
    if (!application) throw new Error('PixiJS application is not initialized')

    const scene = new MainScene(this.context)
    this.application = application
    this.scene = scene

    application.stage.addChild(scene)
    application.renderer.on('resize', this.resizeScene)
    this.resizeScene()

    return null
  }

  exit(): void {
    if (!this.application || !this.scene) return

    this.application.renderer.off('resize', this.resizeScene)
    this.application.stage.removeChild(this.scene)
    this.scene.destroy({ children: true })
    this.application = null
    this.scene = null
  }
}
