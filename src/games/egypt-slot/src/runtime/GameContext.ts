import { Controller } from '../controllers/controller';
import { AutoPlayController } from '../controllers/auto-play-controller/AutoPlayController';
import { AudioController } from '../controllers/audio-controller/AudioController';
import { GameEmitter, type GameEvents } from '../events';
import { SlotApi } from '../network/SlotApi';
import { SlotStore } from '../stores/SlotStore';
import { AudioStore } from '../stores/AudioStore';

export type GameMessages = {
  loading: string;
  loadError: string;
  incompatibleServer: string;
  retry: string;
  insufficientBalance: string;
};

export class GameContext {
  readonly canvas: HTMLCanvasElement;
  readonly messages: GameMessages;
  readonly controllers = new Controller();
  readonly emitter = new GameEmitter<GameEvents>();
  readonly api = new SlotApi();
  readonly slotStore = new SlotStore();
  readonly audioStore = new AudioStore();
  readonly autoPlayController = new AutoPlayController(this.slotStore, this.emitter);
  readonly audio: AudioController;

  constructor(canvas: HTMLCanvasElement, messages: GameMessages) {
    this.canvas = canvas;
    this.messages = messages;
    this.audio = new AudioController(
      this.controllers.assets,
      this.audioStore,
      this.emitter,
      this.slotStore.panel,
    );
  }

  destroy(): void {
    this.audio.destroy();
    this.autoPlayController.destroy();
    this.api.destroy();
    this.emitter.destroy();
    this.controllers.destroy();
  }
}
