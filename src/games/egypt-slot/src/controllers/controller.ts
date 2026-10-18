import { ApplicationController } from './aplication-controller/ApplicationController'
import { AssetsController } from './assets-controller/AssetsController'

export class Controller {
  readonly application = new ApplicationController()
  readonly assets = new AssetsController()

  destroy(): void {
    this.application.destroy()
  }
}
