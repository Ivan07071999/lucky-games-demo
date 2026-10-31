import type { SymbolKey } from '@lucky-games/contracts';
import { Container, Sprite, Text, Texture } from 'pixi.js';
import { EgyptImageAssetKey } from '../../../../assets';
import type { PaytableLayout } from './paytable-layout';
import { makePaytableText } from './paytable-text';

export class FeatureCard extends Container {
  private readonly icon: Sprite;
  private readonly title: Text;
  private readonly description = makePaytableText('', 14);

  constructor(symbol: SymbolKey, title: string) {
    super();
    this.icon = new Sprite(Texture.from(EgyptImageAssetKey.symbols[symbol]));
    this.icon.anchor.set(0.5);
    this.title = makePaytableText(title, 17, true);
    this.description.style.wordWrap = true;
    this.addChild(this.icon, this.title, this.description);
  }

  setDescription(text: string): void {
    this.description.text = text;
  }

  layout(width: number, preset: PaytableLayout): number {
    const iconSize = preset.featureIconSize;
    const textX = preset.featureHorizontal ? iconSize + preset.featureTextGap : width / 2;
    const titleY = preset.featureHorizontal ? 0 : iconSize;
    this.icon.scale.set(
      Math.min(iconSize / this.icon.texture.width, iconSize / this.icon.texture.height),
    );
    this.icon.position.set(preset.featureHorizontal ? iconSize / 2 : width / 2, iconSize / 2);
    this.title.anchor.x = preset.featureHorizontal ? 0 : 0.5;
    this.description.anchor.x = preset.featureHorizontal ? 0 : 0.5;
    this.description.style.align = preset.featureHorizontal ? 'left' : 'center';
    this.title.style.fontSize = preset.featureTitleFontSize;
    this.title.position.set(textX, titleY);
    this.description.style.fontSize = preset.featureDescriptionFontSize;
    this.description.style.wordWrapWidth = Math.max(
      1,
      width - (preset.featureHorizontal ? textX : 6),
    );
    this.description.position.set(
      textX,
      this.title.y + this.title.height + preset.featureDescriptionGap,
    );

    const textBottom = this.description.y + this.description.height;
    return Math.max(iconSize, textBottom) + preset.featureBottomGap;
  }
}
