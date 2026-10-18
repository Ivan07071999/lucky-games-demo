import type { GameContext } from '../runtime/GameContext'
import type { Phase } from './PhaseManager'
import type { EgyptPhase } from './types'

export class LoadingPhase implements Phase<EgyptPhase> {
  private readonly context: GameContext

  constructor(context: GameContext) {
    this.context = context
  }

  async enter(): Promise<EgyptPhase> {
    await this.context.controllers.assets.loader.loadImage('scene', 'background')
    return 'idle'
  }
}
