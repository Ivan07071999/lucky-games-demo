import type { GameMessages } from '../runtime/GameContext';
import { MainSceneController } from '../controllers/main-scene-controller/MainSceneController';
import { ReelsController } from '../controllers/reels-controller/ReelsController';
import { MainScene } from '../scene/MainScene';
import { IdlePhase } from './idle';
import { InitPhase } from './init';
import { LoadingPhase } from './loading';
import { PhaseManager, type PhaseRegistry } from './PhaseManager';
import { ResultPhase } from './result';
import { SpinningPhase } from './spinning';
import { PhaseName, phaseTransitions } from './types';

export class EgyptSlotFlow extends PhaseManager<PhaseName, typeof phaseTransitions> {
  constructor(canvas: HTMLCanvasElement, messages: GameMessages) {
    const scene = new MainScene(canvas, messages);
    const { application, assets } = scene.context.controllers;
    const { api, emitter, slotStore } = scene.context;
    const sceneController = new MainSceneController(application, scene);
    const reelsController = new ReelsController(sceneController, emitter);
    const phases = {
      [PhaseName.init]: new InitPhase(application, canvas),
      [PhaseName.loading]: new LoadingPhase(
        application,
        assets,
        api,
        slotStore,
        sceneController,
        messages,
      ),
      [PhaseName.idle]: new IdlePhase(slotStore, emitter),
      [PhaseName.spinning]: new SpinningPhase(api, slotStore, sceneController, reelsController),
      [PhaseName.result]: new ResultPhase(slotStore, emitter, reelsController),
    } satisfies PhaseRegistry<PhaseName, typeof phaseTransitions>;

    super(PhaseName.init, phases, phaseTransitions, () => {
      sceneController.destroy();
      scene.context.destroy();
    });
  }
}
