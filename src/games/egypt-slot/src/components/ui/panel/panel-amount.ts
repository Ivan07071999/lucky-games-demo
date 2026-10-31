import 'pixi.js/text-bitmap';
import { BitmapText, Container } from 'pixi.js';

export class PanelAmount extends Container {
  readonly valueText: BitmapText;
  private readonly valueMaxWidth: number;

  constructor(title: string, width: number, height: number, value: number) {
    super();

    this.label = `panel-${title.toLowerCase()}`;

    const label = new BitmapText({
      text: title,
      style: {
        fontFamily: 'CasinoGoldBold',
        fontSize: height * 0.12,
        fill: 0xffe3a1,
        align: 'center',
      },
    });
    label.label = `${this.label}-title`;
    label.anchor.set(0.5);
    label.position.set(0, -height * 0.15 - 2);
    label.scale.set(Math.min(1, (width * 0.7) / label.width));

    this.valueText = new BitmapText({
      text: String(value),
      style: {
        fontFamily: 'CasinoGold',
        fontSize: height * 0.23,
        align: 'center',
      },
    });
    this.valueText.label = `${this.label}-value`;
    this.valueText.anchor.set(0.5);
    this.valueText.position.y = height * 0.05;
    this.valueMaxWidth = width * 0.8;
    this.fitValueText();

    this.addChild(label, this.valueText);
  }

  setValue(value: number): void {
    this.valueText.text = String(value);
    this.fitValueText();
  }

  private fitValueText(): void {
    this.valueText.scale.set(Math.min(1, this.valueMaxWidth / Math.max(this.valueText.width, 1)));
  }
}
