import 'pixi.js/text-bitmap';
import { BitmapText, Container, Sprite, Texture } from 'pixi.js';
import { autorun, type IReactionDisposer } from 'mobx';
import { EgyptImageAssetKey } from '../../../assets';
import type { RoundStore } from '../../../stores/RoundStore';
import type { SceneTheme } from '../../../scene/sceneTheme';

const TABLET_WIDTH = 300;
const TABLET_HEIGHT = 100;
const TITLE_COLOR = 0xffdda0;

export class FreeSpinsStatus extends Container {
  private readonly background: Sprite;
  private readonly title: BitmapText;
  private readonly round: RoundStore;
  private readonly stopObserving: IReactionDisposer;
  private theme: SceneTheme = 'base';
  private viewportWidth = 0;
  private viewportHeight = 0;

  constructor(round: RoundStore) {
    super();

    this.round = round;
    this.label = 'free-spins-status';
    this.eventMode = 'none';
    this.visible = false;

    this.background = new Sprite(Texture.from(EgyptImageAssetKey.popups.freeSpinsTablet));
    this.background.anchor.set(0.5);
    this.background.width = TABLET_WIDTH;
    this.background.height = TABLET_HEIGHT;

    this.title = new BitmapText({
      text: '',
      style: {
        fontFamily: 'CasinoGoldBold',
        fontSize: 22,
        fill: TITLE_COLOR,
        align: 'center',
      },
    });
    this.title.anchor.set(0.5);
    this.title.position.y = -4;

    this.addChild(this.background, this.title);

    this.stopObserving = autorun(() => {
      const remaining = round.freeSpins.remaining;
      this.title.text = `FREE SPINS ${remaining}`;
      this.updateVisibility();
      this.layout();
    });
  }

  setTheme(theme: SceneTheme): void {
    this.theme = theme;
    this.updateVisibility();
  }

  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.layout();
  }

  private updateVisibility(): void {
    this.visible = this.theme === 'freeSpins' && this.round.isFreeSpin;
  }

  private layout(): void {
    if (this.viewportWidth <= 0 || this.viewportHeight <= 0) return;

    const scale = Math.min(1, (this.viewportWidth - 24) / TABLET_WIDTH);
    this.scale.set(scale);
    this.position.set(
      this.viewportWidth / 2,
      Math.max(TABLET_HEIGHT * scale * 0.39 + 8, Math.min(this.viewportHeight * 0.07, 60)),
    );
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.stopObserving();
    super.destroy(options);
  }
}
