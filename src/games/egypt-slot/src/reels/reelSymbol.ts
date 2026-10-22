import { Container, Sprite, Texture } from 'pixi.js';
import { EgyptImageAssetKey } from '../assets';
import type { ReelSymbolKey } from './reelsConfig';

export class ReelSymbol extends Container {
  private readonly image: Sprite;
  private readonly cellWidth: number;
  private readonly cellHeight: number;

  constructor(width: number, height: number, symbol: ReelSymbolKey) {
    super();

    this.cellWidth = width;
    this.cellHeight = height;
    this.label = 'reel-symbol';

    this.image = new Sprite();
    this.image.anchor.set(0.5);
    this.image.position.set(width / 2, height / 2);
    this.addChild(this.image);
    this.setValue(symbol);
  }

  setValue(symbol: ReelSymbolKey): void {
    const texture = Texture.from(EgyptImageAssetKey.symbols[symbol]);
    this.image.texture = texture;
    this.image.label = `symbol-${symbol}`;
    this.image.scale.set(
      Math.min((this.cellWidth * 1.08) / texture.width, (this.cellHeight * 1.08) / texture.height),
    );
  }
}
