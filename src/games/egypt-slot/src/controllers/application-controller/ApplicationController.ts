import { Application } from 'pixi.js';

export class ApplicationController {
  private application: Application | null = null;
  private stats: import('pixi-stats').Stats | null = null;
  private statsUpdate: (() => void) | null = null;
  private cancelled = false;

  get current(): Application | null {
    return this.application;
  }

  async init(canvas: HTMLCanvasElement): Promise<Application | null> {
    await Promise.resolve();
    if (this.cancelled) return null;

    const application = new Application();

    try {
      await application.init({
        canvas,
        resizeTo: window,
        background: 0x1b1621,
        antialias: true,
      });
    } catch (error) {
      try {
        if (application.renderer) application.destroy();
        else application.stage.destroy({ children: true });
      } catch (cleanupError) {
        console.warn('Failed to clean up PixiJS after initialization error', cleanupError);
      }
      throw error;
    }

    if (this.cancelled) {
      application.destroy();
      return null;
    }

    if (import.meta.env.DEV) {
      try {
        const { Stats } = await import('pixi-stats');
        if (this.cancelled) {
          application.destroy();
          return null;
        }

        const renderer =
          'gl' in application.renderer
            ? { gl: application.renderer.gl, texture: { managedTextures: [] } }
            : {};
        const stats = new Stats(
          renderer,
          {
            add: (update) => {
              this.statsUpdate = update;
              application.ticker.add(update);
            },
          },
          document.body,
        );
        stats.domElement?.classList.add('pixi-stats-overlay');
        this.stats = stats;
      } catch (error) {
        console.warn('Failed to initialize Pixi stats', error);
      }
    }

    this.application = application;

    return application;
  }

  destroy(): void {
    this.cancelled = true;
    if (this.statsUpdate && this.application) {
      this.application.ticker.remove(this.statsUpdate);
    }
    this.stats?.hidePanel();
    this.stats?.pixiHooks.release();
    this.statsUpdate = null;
    this.stats = null;
    this.application?.destroy();
    this.application = null;
  }
}
