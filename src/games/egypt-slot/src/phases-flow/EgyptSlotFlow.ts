import type { GameMessages } from '../runtime/GameContext';
import { MainSceneController } from '../controllers/main-scene-controller/MainSceneController';
import { MainScene } from '../scene/MainScene';
import { IdlePhase } from './idle';
import { InitPhase } from './init';
import { LoadingPhase } from './loading';
import { PhaseManager, type PhaseRegistry } from './PhaseManager';
import { PhaseName, phaseTransitions } from './types';

export class EgyptSlotFlow extends PhaseManager<PhaseName, typeof phaseTransitions> {
  constructor(canvas: HTMLCanvasElement, messages: GameMessages) {
    const scene = new MainScene(canvas, messages);
    const { application, assets } = scene.context.controllers;
    const sceneController = new MainSceneController(application, scene);
    const phases = {
      [PhaseName.init]: new InitPhase(application, canvas),
      [PhaseName.loading]: new LoadingPhase(application, assets, sceneController, messages.loading),
      [PhaseName.idle]: new IdlePhase(),
    } satisfies PhaseRegistry<PhaseName, typeof phaseTransitions>;

    super(PhaseName.init, phases, phaseTransitions, () => {
      sceneController.destroy();
      scene.context.destroy();
    });
  }
}
