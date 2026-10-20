import { Controller } from '../controllers/controller'
import { EgyptImageAssetKey } from '../assets'
import { ReelsMachine } from '../reelsMachine/ReelsMachine'

export type GameMessages = {
  loading: string
}

export class GameContext {
  readonly canvas: HTMLCanvasElement
  readonly messages: GameMessages
  readonly controllers = new Controller()
  private reelsMachineInstance: ReelsMachine | null = null

  constructor(canvas: HTMLCanvasElement, messages: GameMessages) {
    this.canvas = canvas
    this.messages = messages
  }

  get reelsMachine(): ReelsMachine {
    if (!this.reelsMachineInstance || this.reelsMachineInstance.destroyed) {
      const reelFrameTexture = this.controllers.assets.getImage(
        EgyptImageAssetKey.scene.reelFrameFilled,
      )
      this.reelsMachineInstance = new ReelsMachine(reelFrameTexture)
    }

    return this.reelsMachineInstance
  }

  destroy(): void {
    if (this.reelsMachineInstance && !this.reelsMachineInstance.destroyed) {
      this.reelsMachineInstance.destroy({ children: true })
    }
    this.reelsMachineInstance = null
    this.controllers.destroy()
  }
}
