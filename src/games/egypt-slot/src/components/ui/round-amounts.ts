import 'pixi.js/text-bitmap';
import { BitmapText, Container, Graphics } from 'pixi.js';
import { autorun, type IReactionDisposer } from 'mobx';
import type { SlotStore } from '../../stores/SlotStore';

const CARD_HEIGHT = 46;

class AmountCard extends Container {
  private readonly value: BitmapText;
  private readonly maxValueWidth: number;

  constructor(title: string, width: number) {
    super();
    this.label = `round-${title.toLowerCase().replace(' ', '-')}`;
    this.eventMode = 'none';
    this.maxValueWidth = width - 16;

    const background = new Graphics()
      .roundRect(-width / 2, -CARD_HEIGHT / 2, width, CARD_HEIGHT, 8)
      .fill({ color: 0x24150e, alpha: 0.86 })
      .stroke({ color: 0xc89448, width: 1, alpha: 0.85 });
    const heading = new BitmapText({
      text: title,
      style: { fontFamily: 'CasinoGoldBold', fontSize: 13, fill: 0xffdfa0 },
    });
    heading.anchor.set(0.5);
    heading.position.y = -12;

    this.value = new BitmapText({
      text: '0 COINS',
      style: { fontFamily: 'CasinoGold', fontSize: 19, fill: 0xfff1cf },
    });
    this.value.anchor.set(0.5);
    this.value.position.y = 9;
    this.addChild(background, heading, this.value);
  }

  setAmount(coins: number): void {
    this.value.text = `${coins.toLocaleString('en-US')} COINS`;
    this.value.scale.set(1);
    this.value.scale.set(Math.min(1, this.maxValueWidth / Math.max(this.value.width, 1)));
  }
}

export class RoundAmounts extends Container {
  private readonly stake: AmountCard;
  private readonly stopObserving: IReactionDisposer;

  constructor(store: SlotStore, width: number) {
    super();
    this.label = 'round-amounts';
    this.eventMode = 'none';

    const cardWidth = Math.min(190, width);
    this.stake = new AmountCard('TOTAL BET', cardWidth);
    this.addChild(this.stake);

    this.stopObserving = autorun(() => {
      const { round, panel } = store;
      const current = round.currentRound;
      this.alpha = round.ready ? 1 : 0;
      this.stake.setAmount(current?.bet.totalCoins ?? panel.totalBetCoins);
    });
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.stopObserving();
    super.destroy(options);
  }
}
