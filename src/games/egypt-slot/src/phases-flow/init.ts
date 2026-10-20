import type { ApplicationController } from '../controllers/application-controller/ApplicationController'
import type { Phase } from './PhaseManager'
import { PhaseName, type NextPhase } from './types'

export class InitPhase implements Phase<typeof PhaseName.init, NextPhase<typeof PhaseName.init>> {
  readonly name = PhaseName.init

  private readonly application: ApplicationController
  private readonly canvas: HTMLCanvasElement

  constructor(application: ApplicationController, canvas: HTMLCanvasElement) {
    this.application = application
    this.canvas = canvas
  }

  async enter(signal: AbortSignal): Promise<typeof PhaseName.loading> {
    signal.throwIfAborted()
    const application = await this.application.init(this.canvas)
    signal.throwIfAborted()

    if (!application) throw new Error('PixiJS application was not initialized')
    return PhaseName.loading
  }
}
