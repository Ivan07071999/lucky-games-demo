import type { ApplicationController } from '../controllers/application-controller/ApplicationController';
import type { AssetsController } from '../controllers/assets-controller/AssetsController';
import type { MainSceneController } from '../controllers/main-scene-controller/MainSceneController';
import type { SlotApi } from '../network/SlotApi';
import { SlotContractError } from '../network/SlotApiError';
import { StatusScene } from '../scene/StatusScene';
import type { SlotStore } from '../stores/SlotStore';
import type { GameMessages } from '../runtime/GameContext';
import type { Phase } from './PhaseManager';
import { PhaseName, type NextPhase } from './types';

export class LoadingPhase implements Phase<
  typeof PhaseName.loading,
  NextPhase<typeof PhaseName.loading>
> {
  readonly name = PhaseName.loading;

  private readonly application: ApplicationController;
  private readonly assets: AssetsController;
  private readonly api: SlotApi;
  private readonly store: SlotStore;
  private readonly scene: MainSceneController;
  private readonly messages: GameMessages;
  private status: StatusScene | null = null;

  constructor(
    application: ApplicationController,
    assets: AssetsController,
    api: SlotApi,
    store: SlotStore,
    scene: MainSceneController,
    messages: GameMessages,
  ) {
    this.application = application;
    this.assets = assets;
    this.api = api;
    this.store = store;
    this.scene = scene;
    this.messages = messages;
  }

  async enter(signal: AbortSignal): Promise<NextPhase<typeof PhaseName.loading>> {
    signal.throwIfAborted();
    const application = this.application.current;
    if (!application) throw new Error('PixiJS application is not initialized');

    while (true) {
      this.status?.dispose();
      this.status = new StatusScene(this.messages.loading).show(application);
      try {
        const { state, recoveredRound } = await this.api.initialize(signal);
        await this.assets.loadAll();
        signal.throwIfAborted();
        this.store.applyInitialState(state);
        if (recoveredRound) this.store.applyRoundResult(recoveredRound);
        this.scene.mount();
        return PhaseName.idle;
      } catch (error) {
        if (signal.aborted) throw error;
        console.error('Egypt slot loading failed', error);
        await this.waitForRetry(
          application,
          signal,
          error instanceof SlotContractError
            ? this.messages.incompatibleServer
            : this.messages.loadError,
        );
      }
    }
  }

  private waitForRetry(
    application: NonNullable<ApplicationController['current']>,
    signal: AbortSignal,
    message: string,
  ): Promise<void> {
    this.status?.dispose();
    return new Promise((resolve, reject) => {
      const onRetry = () => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      };
      const onAbort = () => reject(signal.reason);
      this.status = new StatusScene(message, this.messages.retry, onRetry).show(application);
      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted) onAbort();
    });
  }

  exit(): void {
    this.status?.dispose();
    this.status = null;
  }
}
