import type { GameMessages } from '../runtime/GameContext';
import { MainSceneController } from '../controllers/main-scene-controller/MainSceneController';
import { ReelsController } from '../controllers/reels-controller/ReelsController';
import { BalanceController } from '../controllers/balance-controller/BalanceController';
import { WinPopupController } from '../controllers/win-popup-controller/WinPopupController';
import { FreeSpinsThemeController } from '../controllers/free-spins-theme-controller/FreeSpinsThemeController';
import { MainScene } from '../scene/MainScene';
import { FreeSpinsPhase } from './free-spins';
import { FreeSpinsIntroPhase } from './free-spins-intro';
import { FreeSpinsOutroPhase } from './free-spins-outro';
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
    const { api, autoPlayController, emitter, slotStore } = scene.context;
    const sceneController = new MainSceneController(application, scene);
    const reelsController = new ReelsController(
      sceneController,
      emitter,
      slotStore.reels,
      slotStore.round,
    );
    const balanceController = new BalanceController(slotStore.panel);
    const winPopupController = new WinPopupController(sceneController);
    const themeController = new FreeSpinsThemeController(sceneController);
    const unsubscribeMaxBetError = emitter.on('ui:maxBetInsufficientBalance', () => {
      sceneController.showError(messages.insufficientBalance);
    });
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
      [PhaseName.idle]: new IdlePhase(slotStore, emitter, autoPlayController),
      [PhaseName.spinning]: new SpinningPhase(
        api,
        slotStore,
        sceneController,
        reelsController,
        balanceController,
        autoPlayController,
      ),
      [PhaseName.freeSpins]: new FreeSpinsPhase(
        api,
        slotStore,
        sceneController,
        reelsController,
        balanceController,
      ),
      [PhaseName.freeSpinsIntro]: new FreeSpinsIntroPhase(themeController),
      [PhaseName.freeSpinsOutro]: new FreeSpinsOutroPhase(themeController),
      [PhaseName.result]: new ResultPhase(
        slotStore,
        emitter,
        reelsController,
        balanceController,
        winPopupController,
      ),
    } satisfies PhaseRegistry<PhaseName, typeof phaseTransitions>;

    super(PhaseName.init, phases, phaseTransitions, () => {
      unsubscribeMaxBetError();
      reelsController.destroy();
      sceneController.destroy();
      scene.context.destroy();
    });
  }
}
