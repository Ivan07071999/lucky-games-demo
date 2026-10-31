import { Container } from 'pixi.js';
import { AutoPlayButton } from './AutoPlayButton';
import { makeAutoPlayText } from './auto-play-text';

export class AutoPlayFooter extends Container {
  private readonly summary = makeAutoPlayText('', 14);
  private readonly cost = makeAutoPlayText('', 14);
  private readonly error = makeAutoPlayText('', 13, 0x9b2525);
  private readonly startButton: AutoPlayButton;

  constructor(onStart: () => void) {
    super();
    this.startButton = new AutoPlayButton('START AUTO PLAY', onStart);
    this.addChild(this.summary, this.cost, this.startButton, this.error);
  }

  updateSummary(bet: number, level: number): void {
    this.summary.text = `BET ${bet}  |  LEVEL ${level}`;
    this.cost.text = `${bet * level} COINS / SPIN`;
  }

  clearError(): void {
    this.error.text = '';
  }

  setError(message: string): void {
    this.error.text = message;
  }

  layoutPortrait(width: number, padding: number, lowerOffset: number): void {
    this.position.set(padding, 448 + lowerOffset);
    this.summary.position.set(0, 0);
    this.cost.position.set(0, 21);
    this.startButton.resize(width - padding * 2, 43);
    this.startButton.position.set(width / 2 - padding, 58);
    this.error.anchor.set(0.5, 0);
    this.error.position.set(width / 2 - padding, 87);
  }

  layoutLandscape(leftWidth: number, padding: number): void {
    this.position.set(padding, 190);
    this.summary.position.set(0, 0);
    this.cost.position.set(0, 23);
    this.startButton.resize(leftWidth, 40);
    this.startButton.position.set(leftWidth / 2, 68);
    this.error.anchor.set(0.5, 0);
    this.error.position.set(leftWidth / 2, 93);
  }
}
