import type { Application } from 'pixi.js';
import type { ApplicationController } from '../controllers/application-controller/ApplicationController';
import { MainScene } from '../scene/MainScene';
import type { Phase } from './PhaseManager';
import { PhaseName, type NextPhase } from './types';

export class IdlePhase implements Phase<typeof PhaseName.idle, NextPhase<typeof PhaseName.idle>> {
  readonly name = PhaseName.idle;

  private readonly applicationController: ApplicationController;
  private readonly scene: MainScene;
  private application: Application | null = null;

  constructor(application: ApplicationController, scene: MainScene) {
    this.applicationController = application;
    this.scene = scene;
  }

  private readonly resizeScene = () => {
    if (!this.application) return;
    this.scene.resize(this.application.screen.width, this.application.screen.height);
  };

  async enter(signal: AbortSignal): Promise<never> {
    signal.throwIfAborted();
    const application = this.applicationController.current;
    if (!application) throw new Error('PixiJS application is not initialized');

    this.scene.initialize();
    this.application = application;

    application.stage.addChild(this.scene);
    application.renderer.on('resize', this.resizeScene);
    this.resizeScene();

    return new Promise<never>((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      if (signal.aborted) reject(signal.reason);
    });
  }

  exit(): void {
    if (!this.application) return;

    this.application.renderer.off('resize', this.resizeScene);
    this.application.stage.removeChild(this.scene);
    this.scene.destroy({ children: true });
    this.application = null;
  }
}
