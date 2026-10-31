import { NineSliceSprite, Rectangle, Texture } from 'pixi.js';
import { EgyptImageAssetKey } from '../../assets';

const ART_SCALE = 0.22;

export class ScrollModalBackground extends NineSliceSprite {
  constructor() {
    super({
      texture: Texture.from(EgyptImageAssetKey.popups.scrollBackground),
      leftWidth: 155,
      rightWidth: 155,
      topHeight: 140,
      bottomHeight: 145,
    });
    this.eventMode = 'static';
    this.scale.set(ART_SCALE);
  }

  resize(width: number, height: number): void {
    this.setSize(width / ART_SCALE, height / ART_SCALE);
    this.hitArea = new Rectangle(0, 0, width / ART_SCALE, height / ART_SCALE);
  }
}
