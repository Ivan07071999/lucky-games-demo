import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { gsap } from 'gsap';

const ICON_SIZE = 28;
const HIT_SIZE = 44;

export class IconButton extends Container {
  private readonly icon: Sprite;
  private readonly highlight: Graphics;

  constructor(label: string, texture: string, onPress: () => void, highlightAlpha = 0.18) {
    super();
    this.label = label;
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(-HIT_SIZE / 2, -HIT_SIZE / 2, HIT_SIZE, HIT_SIZE);

    this.highlight = new Graphics()
      .circle(0, 0, 16)
      .fill({ color: 0xffd58c, alpha: highlightAlpha });
    this.highlight.alpha = 0;
    this.highlight.eventMode = 'none';
    this.icon = new Sprite(Texture.from(texture));
    this.icon.anchor.set(0.5);
    this.icon.setSize(ICON_SIZE);
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

  protected setIconTexture(texture: Texture): void {
    this.icon.texture = texture;
    this.icon.setSize(ICON_SIZE);
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    gsap.killTweensOf(this.highlight);
    super.destroy(options);
  }
}
