import { Container, Sprite, Texture } from 'pixi.js';
import { autorun, type IReactionDisposer } from 'mobx';
import { EgyptImageAssetKey } from '../../assets';
import type { SceneTheme } from '../../scene/sceneTheme';
import type { SlotStore } from '../../stores/SlotStore';
import { PanelAmount } from './panel-amount';

export class RightBackground extends Container {
  readonly background: Sprite;
  readonly coins: PanelAmount;
  readonly win: PanelAmount;
  private readonly stopObserving: IReactionDisposer;
  private displayedRoundId: string | null = null;

  constructor(height: number, store: SlotStore) {
    super();

    this.label = 'bet-panel-right-background';
    this.background = new Sprite(Texture.from(EgyptImageAssetKey.buttons.panelBackground));
    this.background.label = 'bet-panel-right-background-image';
    this.background.anchor.set(0.5);
    this.background.height = height * 0.15;
    this.background.width =
      this.background.height * (this.background.texture.width / this.background.texture.height);

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
    const width = this.background.width;
    const height = this.background.height;
    this.background.texture = Texture.from(
      theme === 'freeSpins'
        ? EgyptImageAssetKey.buttons.panelBackgroundFreeSpins
        : EgyptImageAssetKey.buttons.panelBackground,
    );
    this.background.width = width;
    this.background.height = height;
  }
}
