import { Container } from 'pixi.js';
import { AutoPlayButton } from './ui/auto-play';
import { LeftBackground } from './ui/left-background';
import { MaxBetButton } from './ui/max-bet';
import { RightBackground } from './ui/right-background';
import { SpinButton } from './ui/spin-button';

export class BetPanel extends Container {
  readonly spinButton: SpinButton;
  readonly leftBackground: LeftBackground;
  readonly rightBackground: RightBackground;
  readonly autoPlayButton: AutoPlayButton;
  readonly maxBetButton: MaxBetButton;

  constructor(width: number, height: number, onSpin?: () => void) {
    super();

    this.label = 'bet-panel';
    this.spinButton = new SpinButton(52, onSpin);
    this.leftBackground = new LeftBackground(height);
    this.rightBackground = new RightBackground(height);
    this.autoPlayButton = new AutoPlayButton(width, height);
    this.maxBetButton = new MaxBetButton(width, height);

    const buttonGap = 8;
    const sideButtonOffset = this.spinButton.width / 2 + this.autoPlayButton.width / 2 + buttonGap;
    const backgroundOffset =
      sideButtonOffset + this.autoPlayButton.width / 2 + buttonGap + this.leftBackground.width / 2;
    this.leftBackground.position.set(-backgroundOffset, 10);
    this.rightBackground.position.set(backgroundOffset, 10);
    this.autoPlayButton.position.set(-sideButtonOffset, 0);
    this.maxBetButton.position.set(sideButtonOffset, 0);
    this.spinButton.position.set(0, -20);

    this.addChild(
      this.leftBackground,
      this.autoPlayButton,
      this.spinButton,
      this.maxBetButton,
      this.rightBackground,
    );
  }
}
