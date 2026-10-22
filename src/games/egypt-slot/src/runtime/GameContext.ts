import { Controller } from '../controllers/controller';
import { ReelsMachine } from '../reelsMachine/ReelsMachine';
import { SlotStore } from '../stores/SlotStore';

export type GameMessages = {
  loading: string;
};

export class GameContext {
  readonly canvas: HTMLCanvasElement;
  readonly messages: GameMessages;
  readonly controllers = new Controller();
  readonly slotStore = new SlotStore();
  private reelsMachineInstance: ReelsMachine | null = null;

  constructor(canvas: HTMLCanvasElement, messages: GameMessages) {
    this.canvas = canvas;
    this.messages = messages;
  }

  get reelsMachine(): ReelsMachine {
    if (!this.reelsMachineInstance || this.reelsMachineInstance.destroyed) {
      this.reelsMachineInstance = new ReelsMachine();
    }

    return this.reelsMachineInstance;
  }

  destroy(): void {
    if (this.reelsMachineInstance && !this.reelsMachineInstance.destroyed) {
      this.reelsMachineInstance.destroy({ children: true });
    }
    this.reelsMachineInstance = null;
    this.controllers.destroy();
  }
}
