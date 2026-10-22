import type { Application } from 'pixi.js';
import type { MainScene } from '../../scene/MainScene';
import type { ApplicationController } from '../application-controller/ApplicationController';

export class MainSceneController {
  private readonly applicationController: ApplicationController;
  private readonly scene: MainScene;
  private application: Application | null = null;

  constructor(applicationController: ApplicationController, scene: MainScene) {
    this.applicationController = applicationController;
    this.scene = scene;
  }

  mount(): void {
    if (this.application) return;

    const application = this.applicationController.current;
    if (!application) throw new Error('PixiJS application is not initialized');
    if (this.scene.destroyed) throw new Error('MainScene has already been destroyed');

    this.scene.initialize();
    this.application = application;

    application.stage.addChild(this.scene);
    application.renderer.on('resize', this.resizeScene);
    this.resizeScene();
  }

  destroy(): void {
    if (this.application) {
      this.application.renderer.off('resize', this.resizeScene);
      this.scene.parent?.removeChild(this.scene);
      this.application = null;
    }

    if (!this.scene.destroyed) this.scene.destroy({ children: true });
  }

  private readonly resizeScene = (): void => {
    if (!this.application) return;

    this.scene.resize(this.application.screen.width, this.application.screen.height);
  };
}
