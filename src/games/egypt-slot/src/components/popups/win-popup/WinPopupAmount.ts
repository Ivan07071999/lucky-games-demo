import 'pixi.js/text-bitmap';
import { BitmapText } from 'pixi.js';
import { WIN_POPUP_LAYOUT } from './winPopupConfig';

export class WinPopupAmount extends BitmapText {
  constructor() {
    super({
      text: '0',
      style: {
        fontFamily: WIN_POPUP_LAYOUT.amount.fontFamily,
        fontSize: WIN_POPUP_LAYOUT.amount.fontSize,
        align: 'center',
      },
    });

    this.anchor.set(0.5);
    this.position.y = WIN_POPUP_LAYOUT.amount.y;
  }

  setAmount(coins: number): void {
    this.text = String(coins);
    this.scale.set(1);
    this.scale.set(Math.min(1, WIN_POPUP_LAYOUT.amount.width / Math.max(this.width, 1)));
  }
}
