import type { ApplicationController } from '../application-controller/ApplicationController';
import type { AssetsController } from '../assets-controller/AssetsController';
import type { SlotApi } from '../../network/SlotApi';
import { SlotContractError } from '../../network/SlotApiError';
import type { GameMessages } from '../../runtime/GameContext';
import type { LoadedGame } from '../../runtime/GameBootstrap';
import { StatusScene } from '../../scene/StatusScene';

type GameApplication = NonNullable<ApplicationController['current']>;

export class LoadingController {
  private readonly api: SlotApi;
  private readonly assets: AssetsController;
  private readonly messages: GameMessages;
  private readonly onLoadingChange: (loading: boolean) => void;
  private status: StatusScene | null = null;

  constructor(
    api: SlotApi,
    assets: AssetsController,
    messages: GameMessages,
    onLoadingChange: (loading: boolean) => void,
  ) {
    this.api = api;
    this.assets = assets;
    this.messages = messages;
    this.onLoadingChange = onLoadingChange;
  }

  async loadWithRetry(application: GameApplication, signal: AbortSignal): Promise<LoadedGame> {
    while (true) {
      this.dispose();
      this.onLoadingChange(true);
      try {
        const game = await this.api.initialize(signal);
        await this.assets.loadAll();
        signal.throwIfAborted();
        return game;
      } catch (error) {
        if (signal.aborted) throw error;
        console.error('Egypt slot loading failed', error);
        this.onLoadingChange(false);
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

  dispose(): void {
    this.status?.dispose();
    this.status = null;
  }

  private waitForRetry(
    application: GameApplication,
    signal: AbortSignal,
    message: string,
  ): Promise<void> {
    this.dispose();
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
}
