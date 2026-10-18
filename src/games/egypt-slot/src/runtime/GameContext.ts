import { Controller } from '../controllers/controller'

export class GameContext {
  readonly canvas: HTMLCanvasElement
  readonly controllers = new Controller()

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  destroy(): void {
    this.controllers.destroy()
  }
}
