import { Container } from 'pixi.js';
import { AutoPlayButton } from './ui/auto-play';
import { LeftBackground } from './ui/left-background';
import { MaxBetButton } from './ui/max-bet';
import { RightBackground } from './ui/right-background';
import { SpinButton } from './ui/spin-button';

const SPIN_DIAMETER = 104;

export type BetPanelLayout = 'wide' | 'compact';

export class BetPanel extends Container {
  readonly spinButton: SpinButton;
  readonly leftBackground: LeftBackground;
  readonly rightBackground: RightBackground;
  readonly autoPlayButton: AutoPlayButton;
  readonly maxBetButton: MaxBetButton;

  constructor(width: number, height: number, onSpin?: () => void) {
    super();

    this.label = 'bet-panel';
    this.spinButton = new SpinButton(SPIN_DIAMETER / 2, onSpin);
    this.leftBackground = new LeftBackground(height);
    this.rightBackground = new RightBackground(height);
    this.autoPlayButton = new AutoPlayButton(width, height);
    this.maxBetButton = new MaxBetButton(width, height);

    this.addChild(
      this.leftBackground,
      this.autoPlayButton,
      this.spinButton,
      this.maxBetButton,
      this.rightBackground,
    );
    this.setLayout('wide');
  }

  setLayout(layout: BetPanelLayout): void {
    const buttonGap = 8;
    const buttonWidth = this.autoPlayButton.background.width;
    const sideButtonOffset = SPIN_DIAMETER / 2 + buttonWidth / 2 + buttonGap;

    if (layout === 'compact') {
      const backgroundHeight = this.leftBackground.background.height;
      const backgroundGap = 8;
      const actionY = backgroundHeight * 1.5 + backgroundGap * 2 + SPIN_DIAMETER / 2;

      this.leftBackground.position.set(0, 0);
      this.rightBackground.position.set(0, backgroundHeight + backgroundGap);
      this.autoPlayButton.position.set(-sideButtonOffset, actionY + 7);
      this.spinButton.position.set(0, actionY);
      this.maxBetButton.position.set(sideButtonOffset, actionY + 7);
      return;
    }

    const backgroundOffset =
      sideButtonOffset + buttonWidth / 2 + buttonGap + this.leftBackground.background.width / 2;
    this.leftBackground.position.set(-backgroundOffset, 10);
    this.rightBackground.position.set(backgroundOffset, 10);
    this.autoPlayButton.position.set(-sideButtonOffset, 0);
    this.maxBetButton.position.set(sideButtonOffset, 0);
    this.spinButton.position.set(0, -20);
  }
}
