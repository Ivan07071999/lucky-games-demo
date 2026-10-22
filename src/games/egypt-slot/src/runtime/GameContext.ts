import { Controller } from '../controllers/controller';
import { SlotStore } from '../stores/SlotStore';

export type GameMessages = {
  loading: string;
};

export class GameContext {
  readonly canvas: HTMLCanvasElement;
  readonly messages: GameMessages;
  readonly controllers = new Controller();
  readonly slotStore = new SlotStore();

  constructor(canvas: HTMLCanvasElement, messages: GameMessages) {
    this.canvas = canvas;
    this.messages = messages;
  }

  destroy(): void {
    this.controllers.destroy();
  }
}
