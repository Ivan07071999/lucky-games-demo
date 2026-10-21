import type { ApplicationController } from '../controllers/application-controller/ApplicationController'
import type { AssetsController } from '../controllers/assets-controller/AssetsController'
import { StatusScene } from '../scene/StatusScene'
import type { Phase } from './PhaseManager'
import { PhaseName, type NextPhase } from './types'

export class LoadingPhase implements Phase<
  typeof PhaseName.loading,
  NextPhase<typeof PhaseName.loading>
> {
  readonly name = PhaseName.loading

  private readonly application: ApplicationController
  private readonly assets: AssetsController
  private readonly message: string
  private status: StatusScene | null = null

  constructor(application: ApplicationController, assets: AssetsController, message: string) {
    this.application = application
    this.assets = assets
    this.message = message
  }

  async enter(signal: AbortSignal): Promise<NextPhase<typeof PhaseName.loading>> {
    signal.throwIfAborted()
    const application = this.application.current
    if (!application) throw new Error('PixiJS application is not initialized')

    this.status = new StatusScene(this.message).show(application)

    await this.assets.loadAll()
    signal.throwIfAborted()
    return PhaseName.idle
  }

  exit(): void {
    this.status?.dispose()
    this.status = null
  }
}
