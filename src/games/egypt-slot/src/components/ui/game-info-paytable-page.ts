import type { SlotState, SymbolKey } from '@lucky-games/contracts';
import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { EgyptImageAssetKey } from '../../assets';
import { SCROLL_MODAL_COLORS } from './scroll-modal-theme';

const PAYING_SYMBOLS: readonly { key: SymbolKey; name: string }[] = [
  { key: 'highAnkh', name: 'ANKH' },
  { key: 'highEye', name: 'EYE' },
  { key: 'highNecklace', name: 'NECKLACE' },
  { key: 'defaultA', name: 'A' },
  { key: 'defaultK', name: 'K' },
  { key: 'defaultQ', name: 'Q' },
  { key: 'defaultJ', name: 'J' },
];

type PayoutCard = { root: Container; icon: Sprite; name: Text; payouts: Text };
type FeatureCard = { root: Container; icon: Sprite; title: Text; description: Text };

const makeText = (text: string, size: number, bold = false): Text =>
  new Text({
    text,
    style: {
      fontFamily: 'Manrope Variable, sans-serif',
      fontSize: size,
      fontWeight: bold ? '800' : '600',
      fill: bold ? SCROLL_MODAL_COLORS.heading : SCROLL_MODAL_COLORS.ink,
      align: 'center',
    },
    anchor: { x: 0.5, y: 0 },
  });

export class GameInfoPaytablePage extends Container {
  private readonly wager = makeText('', 17, true);
  private readonly explanation = makeText(
    'Base line payouts in COINS for 3, 4 or 5 matching symbols.',
    14,
  );
  private readonly cards: PayoutCard[];
  private readonly divider = new Graphics();
  private readonly wild: FeatureCard;
  private readonly scarab: FeatureCard;

  constructor() {
    super();
    this.label = 'game-info-paytable-page';
    this.cards = PAYING_SYMBOLS.map(({ key, name }) => {
      const root = new Container();
      const icon = new Sprite(Texture.from(EgyptImageAssetKey.symbols[key]));
      icon.anchor.set(0.5);
      const nameText = makeText(name, 16, true);
      const payouts = makeText('', 15);
      root.addChild(icon, nameText, payouts);
      this.addChild(root);
      return { root, icon, name: nameText, payouts };
    });
    this.wild = this.makeFeature('wild', 'WILD');
    this.scarab = this.makeFeature('highScarab', 'SCARAB');
    this.addChild(this.wager, this.explanation, this.divider, this.wild.root, this.scarab.root);
  }

  setData(config: SlotState['config'], bet: number, level: number): void {
    const totalBetCoins = bet * level;
    this.wager.text = `BET ${bet} × LEVEL ${level} = ${totalBetCoins.toLocaleString('en-US')} COINS`;
    this.cards.forEach(({ payouts }, index) => {
      const coefficients = config.payouts[PAYING_SYMBOLS[index].key];
      payouts.text = [5, 4, 3]
        .map(
          (count) =>
            `${count}  ·  ${(coefficients[count - 3] * totalBetCoins).toLocaleString('en-US')}`,
        )
        .join('\n');
    });
    this.wild.description.text =
      `Substitutes for paying symbols. Expands to a reel; line wins ×${config.wildMultiplier}. ` +
      'Sticky in Free Spins.';
    this.scarab.description.text = `${config.scatterTriggerCount}+ on a paid spin award ${config.freeSpinsAwarded} Free Spins. No line payout.`;
  }

  layout(width: number, growth = 1): number {
    const columns = width >= 500 ? 4 : width >= 280 ? 3 : 2;
    const compact = width < 600;
    const gap = (compact ? 8 : 16) * growth;
    const cellWidth = Math.max(1, (width - gap * (columns - 1)) / columns);
    const iconSize = Math.min((compact ? 62 : 88) * growth, cellWidth * 0.72);
    const payoutFontSize = (compact ? 12 : 16) * growth;
    const cardHeight = iconSize + (compact ? 70 : 88) * growth;

    this.wager.style.fontSize = (compact ? 14 : 19) * growth;
    this.wager.style.wordWrap = true;
    this.wager.style.wordWrapWidth = width;
    this.wager.position.set(width / 2, 0);
    this.explanation.style.fontSize = (compact ? 12 : 15) * growth;
    this.explanation.style.wordWrap = true;
    this.explanation.style.wordWrapWidth = width;
    this.explanation.position.set(width / 2, this.wager.height + 4 * growth);
    const cardTop = this.explanation.y + this.explanation.height + 10 * growth;

    this.cards.forEach(({ icon, name, payouts }) => {
      icon.scale.set(Math.min(iconSize / icon.texture.width, iconSize / icon.texture.height));
      icon.position.set(0, iconSize / 2);
      name.style.fontSize = (compact ? 13 : 17) * growth;
      name.position.set(0, iconSize);
      payouts.style.fontSize = payoutFontSize;
      payouts.position.set(0, iconSize + (compact ? 21 : 26) * growth);
    });

    let y = cardTop;
    for (let start = 0; start < this.cards.length; start += columns) {
      const rowCount = Math.min(columns, this.cards.length - start);
      const rowWidth = rowCount * cellWidth + (rowCount - 1) * gap;
      const rowStart = (width - rowWidth) / 2 + cellWidth / 2;
      for (let column = 0; column < rowCount; column += 1) {
        this.cards[start + column].root.position.set(rowStart + column * (cellWidth + gap), y);
      }
      y += cardHeight + gap;
    }

    const featureTop = y - gap + (compact ? 14 : 22) * growth;
    this.divider
      .clear()
      .rect(0, featureTop - (compact ? 8 : 12) * growth, width, 1)
      .fill({ color: SCROLL_MODAL_COLORS.buttonBorder, alpha: 0.55 });
    const featureGap = (compact ? 12 : 24) * growth;
    const featureWidth = Math.max(1, (width - featureGap) / 2);
    const horizontal = width >= 520;
    const wildHeight = this.layoutFeature(this.wild, featureWidth, compact, horizontal, growth);
    const scarabHeight = this.layoutFeature(this.scarab, featureWidth, compact, horizontal, growth);
    this.wild.root.position.set(0, featureTop);
    this.scarab.root.position.set(featureWidth + featureGap, featureTop);
    return featureTop + Math.max(wildHeight, scarabHeight) + 8 * growth;
  }

  private makeFeature(symbol: SymbolKey, title: string): FeatureCard {
    const root = new Container();
    const icon = new Sprite(Texture.from(EgyptImageAssetKey.symbols[symbol]));
    icon.anchor.set(0.5);
    const titleText = makeText(title, 17, true);
    const description = makeText('', 14);
    description.style.wordWrap = true;
    root.addChild(icon, titleText, description);
    return { root, icon, title: titleText, description };
  }

  private layoutFeature(
    feature: FeatureCard,
    width: number,
    compact: boolean,
    horizontal: boolean,
    growth: number,
  ): number {
    const iconSize = (horizontal ? (compact ? 54 : 72) : compact ? 50 : 62) * growth;
    feature.icon.scale.set(
      Math.min(iconSize / feature.icon.texture.width, iconSize / feature.icon.texture.height),
    );
    feature.icon.position.set(horizontal ? iconSize / 2 : width / 2, iconSize / 2);
    feature.title.anchor.x = horizontal ? 0 : 0.5;
    feature.description.anchor.x = horizontal ? 0 : 0.5;
    feature.description.style.align = horizontal ? 'left' : 'center';
    feature.title.style.fontSize = (compact ? 13 : 17) * growth;
    const textX = horizontal ? iconSize + 10 * growth : width / 2;
    feature.title.position.set(textX, horizontal ? 0 : iconSize);
    feature.description.style.fontSize = (compact ? 12 : 15) * growth;
    feature.description.style.wordWrapWidth = Math.max(1, width - (horizontal ? textX : 6));
    feature.description.position.set(textX, feature.title.y + feature.title.height + 3 * growth);
    return Math.max(iconSize, feature.description.y + feature.description.height) + 4 * growth;
  }
}
