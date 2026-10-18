import type { GameContext } from '../runtime/GameContext'
import type { Phase } from './PhaseManager'
import type { EgyptPhase } from './types'

export class InitPhase implements Phase<EgyptPhase> {
  private readonly context: GameContext

  constructor(context: GameContext) {
    this.context = context
  }

  async enter(): Promise<EgyptPhase | null> {
    const application = await this.context.controllers.application.init(this.context.canvas)
    return application ? 'loading' : null
  }
}
