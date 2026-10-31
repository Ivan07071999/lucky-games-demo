import type { SlotState } from '@lucky-games/contracts';
import { Container } from 'pixi.js';
import { FeatureSection } from './paytable/FeatureSection';
import { PaytableHeader } from './paytable/PaytableHeader';
import { PayoutGrid } from './paytable/PayoutGrid';
import { getPaytableLayout } from './paytable/paytable-layout';

export class GameInfoPaytablePage extends Container {
  private readonly header = new PaytableHeader();
  private readonly grid = new PayoutGrid();
  private readonly features = new FeatureSection();

  constructor() {
    super();
    this.label = 'game-info-paytable-page';
    this.addChild(this.header, this.grid, this.features);
  }

  setData(config: SlotState['config'], bet: number, level: number): void {
    const totalBetCoins = bet * level;
    this.header.setWager(bet, level, totalBetCoins);
    this.grid.setPayouts(config.payouts, totalBetCoins);
    this.features.setData(config);
  }

  layout(width: number): number {
    const preset = getPaytableLayout(width);
    const cardsTop = this.header.layout(width, preset);
    const gridBottom = this.grid.layout(width, cardsTop, preset);
    return this.features.layout(width, gridBottom, preset);
  }
}
