import { GameContext, type GameMessages } from '../runtime/GameContext'
import { ErrorPhase } from './error'
import { IdlePhase } from './idle'
import { InitPhase } from './init'
import { LoadingPhase } from './loading'
import { PhaseManager } from './PhaseManager'
import type { EgyptPhase } from './types'

export class EgyptSlotFlow extends PhaseManager<EgyptPhase> {
  constructor(canvas: HTMLCanvasElement, messages: GameMessages) {
    const context = new GameContext(canvas, messages)
    const errorPhase = new ErrorPhase(context)

    super(
      'init',
      {
        init: new InitPhase(context),
        loading: new LoadingPhase(context),
        idle: new IdlePhase(context),
        error: errorPhase,
      },
      {
        init: ['loading'],
        loading: ['idle', 'error'],
        idle: [],
        error: ['loading'],
      },
      () => context.destroy(),
    )

    errorPhase.onRetry = () => {
      void this.transition('loading').catch((error: unknown) => {
        console.error('Failed to retry Egypt slot loading', error)
      })
    }
  }
}
