import 'pixi.js/text-bitmap';
import { BitmapText, Container, Graphics, Rectangle } from 'pixi.js';
import { autorun, type IReactionDisposer } from 'mobx';
import type { SlotStore } from '../../stores/SlotStore';

const WIDTH = 94;
const HEIGHT = 38;

export class TurboSpinButton extends Container {
  private readonly background = new Graphics();
  private readonly indicator = new Graphics();
  private readonly caption = new BitmapText({
    text: 'TURBO',
    style: { fontFamily: 'CasinoGoldBold', fontSize: 17, fill: 0xffe4ad },
  });
  private readonly stopObserving: IReactionDisposer;

  constructor(store: SlotStore) {
    super();
    this.label = 'turbo-spin-button';
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(0, 0, WIDTH, HEIGHT);

    this.background.eventMode = 'none';
    this.indicator.eventMode = 'none';
    this.caption.eventMode = 'none';
    this.caption.anchor.set(0.5);
    this.caption.position.set(59, HEIGHT / 2 - 1);
    this.addChild(this.background, this.indicator, this.caption);

    this.on('pointertap', (event) => {
      event.stopPropagation();
      if (store.canToggleTurbo) store.spinSettings.toggleTurbo();
    });
    this.on('pointerover', () => this.scale.set(1.04));
    this.on('pointerout', () => this.scale.set(1));
    this.stopObserving = autorun(() =>
      this.draw(store.spinSettings.turboEnabled, store.canToggleTurbo),
    );
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.stopObserving();
    super.destroy(options);
  }

  private draw(active: boolean, enabled: boolean): void {
    this.eventMode = enabled ? 'static' : 'none';
    this.cursor = enabled ? 'pointer' : 'default';
    this.alpha = enabled ? 1 : 0.6;

    this.background
      .clear()
      .roundRect(0, 0, WIDTH, HEIGHT, 10)
      .fill({ color: active ? 0x275658 : 0x2d201c, alpha: 0.94 })
      .stroke({ color: active ? 0xffd577 : 0xb98943, width: active ? 2 : 1.5 });
    this.indicator
      .clear()
      .circle(16, HEIGHT / 2, 6)
      .fill(active ? 0xffd577 : 0x75634b)
      .stroke({ color: 0xffe4ad, width: 1, alpha: active ? 1 : 0.55 });
  }
}
