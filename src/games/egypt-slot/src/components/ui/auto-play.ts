import 'pixi.js/text-bitmap';
import { BitmapText } from 'pixi.js';
import { EgyptImageAssetKey } from '../../assets';
import { BetActionButton } from './bet-action-button';

export class AutoPlayButton extends BetActionButton {
  private readonly counter: BitmapText;
  private active = false;
  private completed = 0;
  private remaining = 0;

  constructor(width: number, height: number, onPress: () => void) {
    super(width, height, {
      texture: EgyptImageAssetKey.buttons.left,
      label: 'bet-panel-left-button',
      textLabel: 'auto-play-label',
      text: 'AUTO\nPLAY',
    });
    this.counter = new BitmapText({
      text: '0 LEFT',
      style: { fontFamily: 'CasinoGoldBold', fontSize: this.background.height * 0.14 },
    });
    this.counter.anchor.set(0.5);
    this.counter.position.y = this.background.height * 0.3;
    this.counter.visible = false;
    this.addChild(this.counter);
    this.on('pointertap', onPress);
  }

  setAutoPlayStatus(active: boolean, completed: number, remaining: number): void {
    if (this.active === active && this.completed === completed && this.remaining === remaining)
      return;
    this.active = active;
    this.completed = completed;
    this.remaining = remaining;

    const text = active ? 'STOP\nAUTO PLAY' : 'AUTO\nPLAY';
    this.labelText.text = text;
    this.labelText.scale.set(1);
    const labelScale = Math.min(
      1,
      (this.background.width * 0.78) / this.labelText.width,
      (this.background.height * 0.58) / this.labelText.height,
    );
    this.labelText.scale.set(labelScale);
    this.weightLayers.forEach((layer) => {
      layer.text = text;
      layer.scale.set(labelScale);
    });
    this.counter.text = `${completed} / ${remaining} LEFT`;
    this.counter.visible = active;
  }
}
