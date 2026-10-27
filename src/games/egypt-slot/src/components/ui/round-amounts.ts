import 'pixi.js/text-bitmap';
import { BitmapText, Container, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import { autorun, type IReactionDisposer } from 'mobx';
import type { SlotStore } from '../../stores/SlotStore';

const CARD_HEIGHT = 46;
const CARD_GAP = 18;
const WIN_DISPLAY_SECONDS = 3;

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
  private readonly win: AmountCard;
  private readonly stopObserving: IReactionDisposer;
  private readonly cardOffset: number;
  private displayedRoundId: string | null = null;
  private hideWinCall: gsap.core.Tween | null = null;

  constructor(store: SlotStore, width: number) {
    super();
    this.label = 'round-amounts';
    this.eventMode = 'none';

    const cardWidth = Math.min(190, (width - CARD_GAP) / 2);
    this.cardOffset = (cardWidth + CARD_GAP) / 2;
    this.stake = new AmountCard('TOTAL BET', cardWidth);
    this.win = new AmountCard('WIN', cardWidth);
    this.win.position.x = this.cardOffset;
    this.win.alpha = 0;
    this.addChild(this.stake, this.win);

    this.stopObserving = autorun(() => {
      const { round, panel } = store;
      const current = round.currentRound;
      this.alpha = round.ready ? 1 : 0;
      this.stake.setAmount(current?.bet.totalCoins ?? panel.totalBetCoins);

      if (!round.ready || round.stage === 'waitingResult' || round.stage === 'recovering') {
        this.clearWin();
      } else if (round.stage === 'showingWin' && current && current.totalWinCoins > 0) {
        if (this.displayedRoundId !== current.roundId)
          this.showWin(current.roundId, current.totalWinCoins);
      } else if (round.stage === 'idle') {
        if (this.displayedRoundId && this.displayedRoundId !== round.lastRoundResult?.roundId) {
          this.clearWin();
        } else if (this.displayedRoundId && !this.hideWinCall) {
          this.hideWinCall = gsap.delayedCall(WIN_DISPLAY_SECONDS, () => {
            this.hideWinCall = null;
            this.displayedRoundId = null;
            gsap.to(this.win, {
              alpha: 0,
              duration: 0.25,
              onComplete: () => {
                this.stake.position.x = 0;
              },
            });
          });
        }
      }
    });
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.clearWin();
    this.stopObserving();
    super.destroy(options);
  }

  private showWin(roundId: string, coins: number): void {
    this.hideWinCall?.kill();
    this.hideWinCall = null;
    gsap.killTweensOf(this.win);
    this.displayedRoundId = roundId;
    this.stake.position.x = -this.cardOffset;
    this.win.setAmount(coins);
    this.win.alpha = 0;
    gsap.to(this.win, { alpha: 1, duration: 0.2 });
  }

  private clearWin(): void {
    this.hideWinCall?.kill();
    this.hideWinCall = null;
    gsap.killTweensOf(this.win);
    this.displayedRoundId = null;
    this.win.alpha = 0;
    this.stake.position.x = 0;
  }
}
