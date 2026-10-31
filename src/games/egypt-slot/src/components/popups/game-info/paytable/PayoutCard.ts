import type { SymbolKey } from '@lucky-games/contracts';
import { Container, Sprite, Text, Texture } from 'pixi.js';
import { EgyptImageAssetKey } from '../../../../assets';
import type { PaytableLayout } from './paytable-layout';
import { formatPayouts, makePaytableText } from './paytable-text';

export class PayoutCard extends Container {
  readonly symbolKey: SymbolKey;
  private readonly icon: Sprite;
  private readonly nameText: Text;
  private readonly payouts = makePaytableText('', 15);

  constructor(symbolKey: SymbolKey, name: string) {
    super();
    this.symbolKey = symbolKey;
    this.icon = new Sprite(Texture.from(EgyptImageAssetKey.symbols[symbolKey]));
    this.icon.anchor.set(0.5);
    this.nameText = makePaytableText(name, 16, true);
    this.addChild(this.icon, this.nameText, this.payouts);
  }

  setPayout(coefficients: readonly number[], totalBetCoins: number): void {
    this.payouts.text = formatPayouts(coefficients, totalBetCoins);
  }

  layout(preset: PaytableLayout): void {
    this.icon.scale.set(
      Math.min(
        preset.iconSize / this.icon.texture.width,
        preset.iconSize / this.icon.texture.height,
      ),
    );
    this.icon.position.set(0, preset.iconSize / 2);
    this.nameText.style.fontSize = preset.nameFontSize;
    this.nameText.position.set(0, preset.iconSize);
    this.payouts.style.fontSize = preset.payoutFontSize;
    this.payouts.position.set(0, preset.iconSize + preset.payoutGap);
  }
}
