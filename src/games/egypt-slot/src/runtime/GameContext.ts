import { Controller } from '../controllers/controller'

export type GameMessages = {
  loading: string
  loadError: string
  retry: string
}

export class GameContext {
  readonly canvas: HTMLCanvasElement
  readonly messages: GameMessages
  readonly controllers = new Controller()

  constructor(canvas: HTMLCanvasElement, messages: GameMessages) {
    this.canvas = canvas
    this.messages = messages
  }

  destroy(): void {
    this.controllers.destroy()
  }
}
