import { Container, Sprite, Texture } from 'pixi.js';
import { EgyptImageAssetKey } from '../assets';
import { ReelsBoard } from '../reels/ReelsBoard';
import type { ReelSymbols } from '../reels/reelsConfig';

export class ReelsMachine extends Container {
  readonly reelsBoard: ReelsBoard;

  constructor() {
    super();

    const background = this.addBackground();
    const logo = this.addLogo();

    // The purple window is offset from the center of the frame texture.
    const boardWidth = background.width * 0.65;
    const windowCenterX = ((320 + 1705) / 2) * background.scale.x;
    this.reelsBoard = new ReelsBoard(boardWidth, background.height * 0.57);
    this.reelsBoard.position.set(windowCenterX - boardWidth / 2, background.height * 0.23);

    logo.anchor.set(0.5, 0);
    logo.position.x = background.width / 2;

    this.addChild(background, this.reelsBoard, logo);

    const bounds = this.getLocalBounds();
    this.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2.2);
  }

  setSymbols(reels: ReelSymbols): void {
    this.reelsBoard.setSymbols(reels);
  }

  private addBackground(): Sprite {
    const reelFrameFilledTexture = Texture.from(EgyptImageAssetKey.scene.reelFrameFilled);
    const frameBackground = new Sprite(reelFrameFilledTexture);
    frameBackground.label = 'reel-frame-filled-background';
    frameBackground.scale.set(0.55);

    return frameBackground;
  }

  private addLogo(): Sprite {
    const logoFrameTexture = Texture.from(EgyptImageAssetKey.scene.logoLong);
    const frameLogo = new Sprite(logoFrameTexture);
    frameLogo.label = 'logo-frame';
    frameLogo.scale.set(0.25);
    return frameLogo;
  }
}
