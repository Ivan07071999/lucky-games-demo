import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { EgyptImageAssetKey } from '../../assets';

const ICON_SIZE = 36;
const HIT_SIZE = 44;

export class SettingsButton extends Container {
  private readonly icon = new Sprite(Texture.from(EgyptImageAssetKey.buttons.settings));
  private readonly highlight = new Graphics()
    .circle(0, 0, 19)
    .fill({ color: 0xffd58c, alpha: 0.18 });

  constructor(onPress: () => void) {
    super();
    this.label = 'game-settings-button';
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(-HIT_SIZE / 2, -HIT_SIZE / 2, HIT_SIZE, HIT_SIZE);

    this.highlight.alpha = 0;
    this.highlight.eventMode = 'none';
    this.icon.anchor.set(0.5);
    this.icon.width = ICON_SIZE;
    this.icon.height = ICON_SIZE;
    this.icon.eventMode = 'none';
    this.addChild(this.highlight, this.icon);

    this.on('pointertap', (event) => {
      event.stopPropagation();
      onPress();
    });
    this.on('pointerover', () => {
      gsap.to(this.highlight, { alpha: 1, duration: 0.2, overwrite: true });
    });
    this.on('pointerout', () => {
      gsap.to(this.highlight, { alpha: 0, duration: 0.2, overwrite: true });
    });
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    gsap.killTweensOf(this.highlight);
    super.destroy(options);
  }
}
