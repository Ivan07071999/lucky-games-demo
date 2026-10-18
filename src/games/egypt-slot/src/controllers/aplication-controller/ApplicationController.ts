import { Application } from 'pixi.js'

export class ApplicationController {
  private application: Application | null = null
  private cancelled = false

  get current(): Application | null {
    return this.application
  }

  async init(canvas: HTMLCanvasElement): Promise<Application | null> {
    await Promise.resolve()
    if (this.cancelled) return null

    const application = new Application()

    await application.init({
      canvas,
      resizeTo: window,
      background: 0x1b1621,
      antialias: true,
    })

    if (this.cancelled) {
      application.destroy()
      return null
    }

    this.application = application

    return application
  }

  destroy(): void {
    this.cancelled = true
    this.application?.destroy()
    this.application = null
  }
}
