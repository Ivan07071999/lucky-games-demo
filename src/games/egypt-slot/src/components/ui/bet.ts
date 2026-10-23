import 'pixi.js/text-bitmap';
import { BitmapText, Container, Graphics, Rectangle } from 'pixi.js';
import { gsap } from 'gsap';

export class Bet extends Container {
  readonly valueText: BitmapText;
  private readonly valueMaxWidth: number;
  private readonly valueVisual = new Container();
  private readonly underline = new Graphics();
  private readonly underlineY: number;
  private enabled = true;

  constructor(width: number, height: number, value: number, onPress: () => void) {
    super();

    this.label = 'bet';
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(-width * 0.22, -height * 0.09, width * 0.44, height * 0.35);
    this.on('pointertap', onPress);
    this.on('pointerover', this.showHover, this);
    this.on('pointerout', this.hideHover, this);

    const label = new BitmapText({
      text: 'BET',
      style: {
        fontFamily: 'CasinoGoldBold',
        fontSize: height * 0.12,
        fill: 0xffe3a1,
        align: 'center',
      },
    });
    label.label = 'bet-title';
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
    this.valueText.label = 'bet-value';
    this.valueText.anchor.set(0.5);
    this.valueMaxWidth = width * 0.32;
    this.underlineY = height * 0.18;
    this.underline.alpha = 0.45;
    this.valueVisual.position.y = height * 0.05;
    this.valueVisual.addChild(this.underline, this.valueText);
    this.fitValueText();
    this.drawUnderline();

    this.addChild(label, this.valueVisual);
  }

  setValue(value: number): void {
    this.valueText.text = String(value);
    this.fitValueText();
    this.drawUnderline();
  }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    this.eventMode = enabled ? 'static' : 'none';
    this.cursor = enabled ? 'pointer' : 'default';
    this.alpha = enabled ? 1 : 0.5;
    if (!enabled) this.hideHover();
  }

  private fitValueText(): void {
    this.valueText.scale.set(1);
    this.valueText.scale.set(Math.min(1, this.valueMaxWidth / this.valueText.width));
  }

  private drawUnderline(): void {
    const halfWidth = Math.max(10, Math.min(this.valueMaxWidth * 0.6, this.valueText.width * 0.55));
    this.underline
      .clear()
      .moveTo(-halfWidth, this.underlineY)
      .lineTo(halfWidth, this.underlineY)
      .stroke({
        color: 0xd9ae71,
        width: 1,
        cap: 'round',
      });
  }

  private showHover(): void {
    if (!this.enabled) return;
    gsap.killTweensOf(this.valueVisual.scale);
    gsap.killTweensOf(this.underline);
    gsap.to(this.valueVisual.scale, { x: 1.015, y: 1.015, duration: 0.24, ease: 'power2.out' });
    gsap.to(this.underline, { alpha: 0.7, duration: 0.24, ease: 'power2.out' });
  }

  private hideHover(): void {
    gsap.killTweensOf(this.valueVisual.scale);
    gsap.killTweensOf(this.underline);
    gsap.to(this.valueVisual.scale, { x: 1, y: 1, duration: 0.24, ease: 'power2.out' });
    gsap.to(this.underline, { alpha: 0.45, duration: 0.24, ease: 'power2.out' });
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    gsap.killTweensOf(this.valueVisual.scale);
    gsap.killTweensOf(this.underline);
    super.destroy(options);
  }
}
