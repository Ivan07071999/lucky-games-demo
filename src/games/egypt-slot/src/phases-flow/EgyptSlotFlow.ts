import { GameContext } from '../runtime/GameContext'
import { IdlePhase } from './idle'
import { InitPhase } from './init'
import { LoadingPhase } from './loading'
import { PhaseManager } from './PhaseManager'
import type { EgyptPhase } from './types'

export class EgyptSlotFlow extends PhaseManager<EgyptPhase> {
  constructor(canvas: HTMLCanvasElement) {
    const context = new GameContext(canvas)

    super(
      'init',
      {
        init: new InitPhase(context),
        loading: new LoadingPhase(context),
        idle: new IdlePhase(context),
      },
      () => context.destroy(),
    )
  }
}
