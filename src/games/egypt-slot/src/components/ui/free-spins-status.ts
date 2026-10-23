import 'pixi.js/text-bitmap';
import { BitmapText, Container, Graphics } from 'pixi.js';
import { autorun, type IReactionDisposer } from 'mobx';
import type { RoundStore } from '../../stores/RoundStore';

export class FreeSpinsStatus extends Container {
  private readonly background = new Graphics();
  private readonly title: BitmapText;
  private readonly detail: BitmapText;
  private readonly stopObserving: IReactionDisposer;
  private viewportWidth = 0;
  private viewportHeight = 0;

  constructor(round: RoundStore) {
    super();

    this.label = 'free-spins-status';
    this.eventMode = 'none';
    this.visible = false;

    this.title = new BitmapText({
      text: '',
      style: { fontFamily: 'CasinoGoldBold', fontSize: 26, fill: 0xffe3a1, align: 'center' },
    });
    this.title.anchor.set(0.5);
    this.title.position.y = -11;

    this.detail = new BitmapText({
      text: 'BET LOCKED  NO COINS CHARGED',
      style: { fontFamily: 'CasinoGoldBold', fontSize: 14, fill: 0xffffff, align: 'center' },
    });
    this.detail.anchor.set(0.5);
    this.detail.position.y = 14;

    this.addChild(this.background, this.title, this.detail);

    this.stopObserving = autorun(() => {
      const remaining = round.freeSpins.remaining;
      this.visible = round.isFreeSpin;
      if (!this.visible) return;

      this.title.text = `FREE SPINS ${remaining}`;
      const width = Math.max(this.title.width, this.detail.width) + 38;
      this.background
        .clear()
        .roundRect(-width / 2, -34, width, 68, 12)
        .fill({ color: 0x211126, alpha: 0.93 })
        .stroke({ color: 0xd69838, width: 2 });
      this.layout();
    });
  }

  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.layout();
  }

  private layout(): void {
    if (this.viewportWidth <= 0 || this.viewportHeight <= 0) return;

    const scale = Math.min(1, (this.viewportWidth - 24) / Math.max(this.background.width, 1));
    this.scale.set(scale);
    this.position.set(
      this.viewportWidth / 2,
      Math.max(38 * scale + 8, Math.min(this.viewportHeight * 0.07, 60)),
    );
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.stopObserving();
    super.destroy(options);
  }
}
