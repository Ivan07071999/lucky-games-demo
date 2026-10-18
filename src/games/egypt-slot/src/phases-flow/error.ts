import type { GameContext } from '../runtime/GameContext'
import { StatusScene } from '../scene/StatusScene'
import type { Phase } from './PhaseManager'
import type { EgyptPhase } from './types'

export class ErrorPhase implements Phase<EgyptPhase> {
  private readonly context: GameContext
  private status: StatusScene | null = null
  onRetry: (() => void) | null = null

  constructor(context: GameContext) {
    this.context = context
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') this.onRetry?.()
  }

  enter(): null {
    const application = this.context.controllers.application.current
    if (!application) throw new Error('PixiJS application is not initialized')

    this.status = new StatusScene(
      this.context.messages.loadError,
      this.context.messages.retry,
      () => this.onRetry?.(),
    ).show(application)
    window.addEventListener('keydown', this.handleKeyDown)
    return null
  }

  exit(): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    this.status?.dispose()
    this.status = null
  }
}
