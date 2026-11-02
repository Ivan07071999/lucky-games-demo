import type { RoundResult } from '@lucky-games/contracts';
import type { ApplicationController } from '../controllers/application-controller/ApplicationController';
import type { AssetsController } from '../controllers/assets-controller/AssetsController';
import { LoadingController } from '../controllers/loading-controller/LoadingController';
import type { MainSceneController } from '../controllers/main-scene-controller/MainSceneController';
import type { SlotApi } from '../network/SlotApi';
import type { SlotStore } from '../stores/SlotStore';
import type { GameMessages } from '../runtime/GameContext';
import type { Phase } from '../fsm/PhaseManager';
import { GameBootstrap } from '../runtime/GameBootstrap';
import { PhaseName, type NextPhase } from '../fsm/transitions';

export class LoadingPhase implements Phase<
  typeof PhaseName.loading,
  NextPhase<typeof PhaseName.loading>
> {
  readonly name = PhaseName.loading;

  private readonly application: ApplicationController;
  private readonly api: SlotApi;
  private readonly store: SlotStore;
  private readonly bootstrap: GameBootstrap;
  private readonly loader: LoadingController;
  private readonly onLoadingChange: (loading: boolean) => void;

  constructor(
    application: ApplicationController,
    assets: AssetsController,
    api: SlotApi,
    store: SlotStore,
    scene: MainSceneController,
    messages: GameMessages,
    onLoadingChange: (loading: boolean) => void,
  ) {
    this.application = application;
    this.api = api;
    this.store = store;
    this.bootstrap = new GameBootstrap(store, scene);
    this.loader = new LoadingController(api, assets, messages, onLoadingChange);
    this.onLoadingChange = onLoadingChange;
  }

  async enter(signal: AbortSignal): Promise<NextPhase<typeof PhaseName.loading>> {
    signal.throwIfAborted();
    const application = this.application.current;
    if (!application) throw new Error('PixiJS application is not initialized');

    const game = await this.loader.loadWithRetry(application, signal);
    signal.throwIfAborted();
    this.bootstrap.prepare(game, this.api.pendingAction);
    this.onLoadingChange(false);
    return this.chooseNextPhase(game.recoveredRound);
  }

  private chooseNextPhase(recoveredRound: RoundResult | null): NextPhase<typeof PhaseName.loading> {
    if (recoveredRound) return PhaseName.result;
    if (this.api.hasPendingRound) return PhaseName.recovering;
    return this.store.session.isFreeSpin ? PhaseName.freeSpins : PhaseName.idle;
  }

  exit(): void {
    this.loader.dispose();
  }
}
