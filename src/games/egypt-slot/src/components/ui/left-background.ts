import { Container, Sprite, Texture } from 'pixi.js';
import { EgyptImageAssetKey } from '../../assets';
import { Bet } from './bet';
import { LevelSwitcher } from './level-switcher';
import type { ValueSwitcherActions } from './value-switcher';

export class LeftBackground extends Container {
  readonly background: Sprite;
  readonly bet: Bet;
  readonly levelSwitcher: LevelSwitcher;

  constructor(
    height: number,
    bet: number,
    level: number,
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

    this.bet = new Bet(this.background.width, this.background.height, bet, onBetRequested);
    this.bet.position.set(-this.background.width * 0.25, -10);
    this.levelSwitcher = new LevelSwitcher(
      this.background.width,
      this.background.height,
      level,
      levelActions,
    );
    this.levelSwitcher.position.set(this.background.width * 0.25, -10);
    this.addChild(this.background, this.bet, this.levelSwitcher);
  }
}
