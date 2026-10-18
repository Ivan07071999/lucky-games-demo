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

    try {
      await application.init({
        canvas,
        resizeTo: window,
        background: 0x1b1621,
        antialias: true,
      })
    } catch (error) {
      try {
        if (application.renderer) application.destroy()
        else application.stage.destroy({ children: true })
      } catch (cleanupError) {
        console.warn('Failed to clean up PixiJS after initialization error', cleanupError)
      }
      throw error
    }

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
