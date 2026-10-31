import { Container } from 'pixi.js';
import { autorun, type IReactionDisposer } from 'mobx';
import type { SceneTheme } from '../../../scene/sceneTheme';
import type { SlotStore } from '../../../stores/SlotStore';
import { PanelAmount } from './panel-amount';
import { PanelBackground } from './panel-background';

export class RightBackground extends Container {
  readonly background: PanelBackground;
  readonly coins: PanelAmount;
  readonly win: PanelAmount;
  private readonly stopObserving: IReactionDisposer;
  private displayedRoundId: string | null = null;

  constructor(height: number, store: SlotStore) {
    super();

    this.label = 'bet-panel-right-background';
    this.background = new PanelBackground('bet-panel-right-background-image', height);

    const amountWidth = this.background.width / 2;
    const amountOffset = this.background.width * 0.25;
    this.coins = new PanelAmount('COINS', amountWidth, this.background.height, 0);
    this.win = new PanelAmount('WIN', amountWidth, this.background.height, 0);
    this.win.position.set(-amountOffset, -10);
    this.coins.position.set(amountOffset, -10);
    this.addChild(this.background, this.win, this.coins);

    this.stopObserving = autorun(() => {
      const { round, panel } = store;
      const completed = round.currentRound;
      this.coins.setValue(panel.displayBalanceCoins);

      if (round.winDisplayReady && completed && this.displayedRoundId !== completed.roundId) {
        this.displayedRoundId = completed.roundId;
        this.win.setValue(completed.totalWinCoins);
      }
    });
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.stopObserving();
    super.destroy(options);
  }

  setTheme(theme: SceneTheme): void {
    this.background.setTheme(theme);
  }
}
