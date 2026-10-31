import type { SlotState, SymbolKey } from '@lucky-games/contracts';
import { Container } from 'pixi.js';
import type { PaytableLayout } from './paytable-layout';
import { PayoutCard } from './PayoutCard';

const PAYING_SYMBOLS: readonly { key: SymbolKey; name: string }[] = [
  { key: 'highAnkh', name: 'ANKH' },
  { key: 'highEye', name: 'EYE' },
  { key: 'highNecklace', name: 'NECKLACE' },
  { key: 'defaultA', name: 'A' },
  { key: 'defaultK', name: 'K' },
  { key: 'defaultQ', name: 'Q' },
  { key: 'defaultJ', name: 'J' },
];

export class PayoutGrid extends Container {
  private readonly cards = PAYING_SYMBOLS.map(({ key, name }) => new PayoutCard(key, name));

  constructor() {
    super();
    this.addChild(...this.cards);
  }

  setPayouts(payouts: SlotState['config']['payouts'], totalBetCoins: number): void {
    this.cards.forEach((card) => {
      card.setPayout(payouts[card.symbolKey], totalBetCoins);
    });
  }

  layout(width: number, top: number, preset: PaytableLayout): number {
    this.position.y = top;
    const cellWidth = Math.max(1, (width - preset.gap * (preset.columns - 1)) / preset.columns);
    this.cards.forEach((card) => card.layout(preset));

    let rowTop = 0;
    for (let start = 0; start < this.cards.length; start += preset.columns) {
      const rowCount = Math.min(preset.columns, this.cards.length - start);
      const rowWidth = rowCount * cellWidth + (rowCount - 1) * preset.gap;
      const rowStart = (width - rowWidth) / 2 + cellWidth / 2;
      for (let column = 0; column < rowCount; column += 1) {
        this.cards[start + column].position.set(
          rowStart + column * (cellWidth + preset.gap),
          rowTop,
        );
      }
      rowTop += preset.cardHeight + preset.gap;
    }

    return top + rowTop - preset.gap;
  }
}
