import { Container } from 'pixi.js';
import type { PaytableLayout } from './paytable-layout';
import { formatWager, makePaytableText } from './paytable-text';

export class PaytableHeader extends Container {
  private readonly wager = makePaytableText('', 17, true);
  private readonly explanation = makePaytableText(
    'Base line payouts in COINS for 3, 4 or 5 matching symbols.',
    14,
  );

  constructor() {
    super();
    this.addChild(this.wager, this.explanation);
  }

  setWager(bet: number, level: number, totalBetCoins: number): void {
    this.wager.text = formatWager(bet, level, totalBetCoins);
  }

  layout(width: number, preset: PaytableLayout): number {
    this.wager.style.fontSize = preset.wagerFontSize;
    this.wager.style.wordWrap = true;
    this.wager.style.wordWrapWidth = width;
    this.wager.position.set(width / 2, 0);

    this.explanation.style.fontSize = preset.explanationFontSize;
    this.explanation.style.wordWrap = true;
    this.explanation.style.wordWrapWidth = width;
    this.explanation.position.set(width / 2, this.wager.height + preset.headerGap);
    return this.explanation.y + this.explanation.height + preset.contentGap;
  }
}
