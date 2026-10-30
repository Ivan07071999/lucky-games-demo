import { Container, Sprite, Texture } from 'pixi.js';
import { EgyptImageAssetKey } from '../../assets';
import type { SceneTheme } from '../../scene/sceneTheme';
import { Bet } from './bet';
import { LevelSwitcher } from './level-switcher';
import { PanelAmount } from './panel-amount';
import type { ValueSwitcherActions } from './value-switcher';

export class LeftBackground extends Container {
  readonly background: Sprite;
  readonly bet: Bet;
  readonly levelSwitcher: LevelSwitcher;
  readonly totalBet: PanelAmount;

  constructor(
    height: number,
    bet: number,
    level: number,
    totalBetCoins: number,
    levelActions: ValueSwitcherActions,
    onBetRequested: () => void,
  ) {
    super();

    this.label = 'bet-panel-left-background';
    this.background = new Sprite(Texture.from(EgyptImageAssetKey.buttons.panelBackground));
    this.background.label = 'bet-panel-left-background-image';
    this.background.anchor.set(0.5);
    this.background.height = height * 0.15;
    this.background.width =
      this.background.height * (this.background.texture.width / this.background.texture.height);

    const columnWidth = this.background.width / 3;
    const controlWidth = columnWidth * 2;
    this.bet = new Bet(controlWidth, this.background.height, bet, onBetRequested);
    this.bet.position.set(-columnWidth, -10);
    this.levelSwitcher = new LevelSwitcher(
      controlWidth,
      this.background.height,
      level,
      levelActions,
    );
    this.levelSwitcher.position.set(0, -10);
    this.totalBet = new PanelAmount(
      'TOTAL BET',
      columnWidth,
      this.background.height,
      totalBetCoins,
    );
    this.totalBet.position.set(columnWidth, -10);
    this.addChild(this.background, this.bet, this.levelSwitcher, this.totalBet);
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
