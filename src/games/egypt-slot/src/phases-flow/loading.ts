import type { GameContext } from '../runtime/GameContext'
import { StatusScene } from '../scene/StatusScene'
import type { Phase } from './PhaseManager'
import type { EgyptPhase } from './types'

export class LoadingPhase implements Phase<EgyptPhase> {
  private readonly context: GameContext
  private status: StatusScene | null = null

  constructor(context: GameContext) {
    this.context = context
  }

  async enter(): Promise<EgyptPhase> {
    const application = this.context.controllers.application.current
    if (!application) throw new Error('PixiJS application is not initialized')

    this.status = new StatusScene(this.context.messages.loading).show(application)

    try {
      await this.context.controllers.assets.loadBackground()
      return 'idle'
    } catch (error) {
      console.error('Failed to load Egypt slot assets', error)
      return 'error'
    }
  }

  exit(): void {
    this.status?.dispose()
    this.status = null
  }
}
