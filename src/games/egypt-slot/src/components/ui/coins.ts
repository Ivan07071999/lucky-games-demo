import 'pixi.js/text-bitmap';
import { BitmapText, Container } from 'pixi.js';

export class Coins extends Container {
  readonly valueText: BitmapText;
  private readonly valueMaxWidth: number;

  constructor(width: number, height: number, value: number) {
    super();

    this.label = 'coins';

    const label = new BitmapText({
      text: 'COINS',
      style: {
        fontFamily: 'CasinoGoldBold',
        fontSize: height * 0.12,
        fill: 0xffe3a1,
        align: 'center',
      },
    });
    label.label = 'coins-title';
    label.anchor.set(0.5);
    label.position.set(0, -height * 0.15 - 2);
    label.scale.set(Math.min(1, (width * 0.32) / label.width));

    this.valueText = new BitmapText({
      text: String(value),
      style: {
        fontFamily: 'CasinoGold',
        fontSize: height * 0.23,
        align: 'center',
      },
    });
    this.valueText.label = 'coins-value';
    this.valueText.anchor.set(0.5);
    this.valueText.position.y = height * 0.05;
    this.valueMaxWidth = width * 0.42;
    this.fitValueText();

    this.addChild(label, this.valueText);
  }

  setValue(value: number): void {
    this.valueText.text = String(value);
    this.fitValueText();
  }

  private fitValueText(): void {
    this.valueText.scale.set(Math.min(1, this.valueMaxWidth / this.valueText.width));
  }
}
