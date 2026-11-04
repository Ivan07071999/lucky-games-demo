import { Container } from 'pixi.js';
import type { SceneTheme } from '../../../scene/sceneTheme';
import { Bet } from '../controls/bet';
import { LevelSwitcher } from '../controls/level-switcher';
import type { ValueSwitcherActions } from '../controls/value-switcher';
import { PanelAmount } from './panel-amount';
import { PanelBackground } from './panel-background';

export class LeftBackground extends Container {
  readonly background: PanelBackground;
  readonly bet: Bet;
  readonly levelSwitcher: LevelSwitcher;
  readonly totalBet: PanelAmount;
  private readonly content = new Container();

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
    this.background = new PanelBackground('bet-panel-left-background-image', height);

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
    this.content.addChild(this.bet, this.levelSwitcher, this.totalBet);
    this.addChild(this.background, this.content);
  }

  setResponsiveScale(scale: number, widthScale = 1): void {
    this.background.setResponsiveScale(scale, widthScale);
    this.content.scale.set(scale);
    const columnOffset = this.background.width / (3 * scale);
    this.bet.position.x = -columnOffset;
    this.totalBet.position.x = columnOffset;
  }

  setTheme(theme: SceneTheme): void {
    this.background.setTheme(theme);
  }
}
