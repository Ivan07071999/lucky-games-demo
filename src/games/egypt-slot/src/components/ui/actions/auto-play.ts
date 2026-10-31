import 'pixi.js/text-bitmap';
import { BitmapText, Graphics } from 'pixi.js';
import { EgyptImageAssetKey } from '../../../assets';
import { BetActionButton } from './bet-action-button';

const LABEL_VERTICAL_OFFSET = -0.15;
const AUTO_PLAY_VERTICAL_OFFSET = -0.12;

export class AutoPlayButton extends BetActionButton {
  private readonly counterBackground: Graphics;
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
    const labelY = this.background.height * AUTO_PLAY_VERTICAL_OFFSET;
    this.labelText.position.set(0, labelY);

    this.counterBackground = new Graphics();
    this.counterBackground.eventMode = 'none';
    this.counterBackground.visible = false;
    this.counter = new BitmapText({
      text: '',
      style: {
        fontFamily: 'CasinoGoldBold',
        fontSize: this.background.height * 0.17,
        fill: 0xffdfa0,
        align: 'center',
      },
    });
    this.counter.anchor.set(0.5);
    this.counter.eventMode = 'none';
    this.counter.visible = false;
    this.addChild(this.counterBackground, this.counter);
    this.on('pointertap', onPress);
  }

  setAutoPlayStatus(active: boolean, completed: number, remaining: number): void {
    if (this.active === active && this.completed === completed && this.remaining === remaining)
      return;
    this.active = active;
    this.completed = completed;
    this.remaining = remaining;

    const text = active ? 'STOP' : 'AUTO\nPLAY';
    this.labelText.text = text;
    const labelY =
      this.background.height * (active ? LABEL_VERTICAL_OFFSET : AUTO_PLAY_VERTICAL_OFFSET);
    this.labelText.position.y = labelY;
    this.labelText.scale.set(1);
    const labelScale = Math.min(
      1,
      (this.background.width * (active ? 0.72 : 0.78)) / this.labelText.width,
      (this.background.height * (active ? 0.6 : 0.72)) / this.labelText.height,
    );
    this.labelText.scale.set(labelScale);
    this.counter.text = `${completed} / ${remaining} LEFT`;
    this.counter.position.y = this.background.height / 2 + this.counter.height / 2 + 8;
    const counterWidth = Math.max(this.background.width * 0.82, this.counter.width + 16);
    const counterHeight = this.counter.height + 8;
    this.counterBackground
      .clear()
      .roundRect(
        -counterWidth / 2,
        this.counter.position.y - counterHeight / 2,
        counterWidth,
        counterHeight,
        counterHeight / 2,
      )
      .fill({ color: 0x35191a, alpha: 0.94 })
      .stroke({ color: 0xd9a64c, width: 1 });
    this.counterBackground.visible = active;
    this.counter.visible = active;
  }
}
