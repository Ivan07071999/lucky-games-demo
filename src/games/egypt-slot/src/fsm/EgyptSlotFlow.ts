import type { GameMessages } from '../runtime/GameContext';
import { MainSceneController } from '../controllers/main-scene-controller/MainSceneController';
import { ReelsController } from '../controllers/reels-controller/ReelsController';
import { BalanceController } from '../controllers/balance-controller/BalanceController';
import { FreeSpinsThemeController } from '../controllers/free-spins-theme-controller/FreeSpinsThemeController';
import { MainScene } from '../scene/MainScene';
import { FreeSpinsPhase } from '../phases-flow/free-spins';
import { FreeSpinsIntroPhase } from '../phases-flow/free-spins-intro';
import { FreeSpinsOutroPhase } from '../phases-flow/free-spins-outro';
import { IdlePhase } from '../phases-flow/idle';
import { InitPhase } from '../phases-flow/init';
import { LoadingPhase } from '../phases-flow/loading';
import { PhaseManager, type PhaseRegistry } from './PhaseManager';
import { RecoveringPhase } from '../phases-flow/recovering';
import { ResultPhase } from '../phases-flow/result';
import { SpinningPhase } from '../phases-flow/spinning';
import { PhaseName, phaseTransitions } from './transitions';

export class EgyptSlotFlow extends PhaseManager<PhaseName, typeof phaseTransitions> {
  constructor(
    canvas: HTMLCanvasElement,
    messages: GameMessages,
    onLoadingChange: (loading: boolean) => void = () => {},
  ) {
    const scene = new MainScene(canvas, messages);
    const { application, assets, api, audio, autoPlayController, emitter, slotStore } =
      scene.context;
    const sceneController = new MainSceneController(application, scene);
    const reelsController = new ReelsController(
      sceneController,
      emitter,
      slotStore.round,
      () => slotStore.spinSettings.turboEnabled,
    );
    const balanceController = new BalanceController(slotStore.balance);
    const themeController = new FreeSpinsThemeController(sceneController, audio);
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
        onLoadingChange,
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
      [PhaseName.freeSpins]: new FreeSpinsPhase(api, slotStore, sceneController, reelsController),
      [PhaseName.recovering]: new RecoveringPhase(
        api,
        slotStore,
        sceneController,
        reelsController,
        balanceController,
        messages,
      ),
      [PhaseName.freeSpinsIntro]: new FreeSpinsIntroPhase(themeController),
      [PhaseName.freeSpinsOutro]: new FreeSpinsOutroPhase(themeController),
      [PhaseName.result]: new ResultPhase(
        slotStore,
        emitter,
        reelsController,
        balanceController,
        audio,
        sceneController,
      ),
    } satisfies PhaseRegistry<PhaseName, typeof phaseTransitions>;

    super(
      PhaseName.init,
      phases,
      phaseTransitions,
      () => {
        unsubscribeMaxBetError();
        reelsController.destroy();
        sceneController.destroy();
        scene.context.destroy();
      },
      slotStore,
    );
  }
}
