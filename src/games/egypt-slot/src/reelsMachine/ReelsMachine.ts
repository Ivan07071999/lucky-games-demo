import { Container, Rectangle, Sprite, Texture } from 'pixi.js';
import { EgyptImageAssetKey } from '../assets';
import { ReelsBoard } from '../reels/ReelsBoard';
import type { ReelsMatrix } from '../reels/reelsConfig';

const FRAME_SCALE = 0.55;
const FRAME_TRANSPARENT_LEFT = 96;
const FRAME_TRANSPARENT_RIGHT = 69;
const REELS_WINDOW_LEFT = 320;
const REELS_WINDOW_RIGHT = 1705;

export class ReelsMachine extends Container {
  readonly reelsBoard: ReelsBoard;
  private readonly croppedFrameTexture: Texture;

  constructor(initialReels: ReelsMatrix) {
    super();

    const frameTexture = Texture.from(EgyptImageAssetKey.scene.reelFrameFilled);
    this.croppedFrameTexture = new Texture({
      source: frameTexture.source,
      frame: new Rectangle(
        FRAME_TRANSPARENT_LEFT,
        0,
        frameTexture.width - FRAME_TRANSPARENT_LEFT - FRAME_TRANSPARENT_RIGHT,
        frameTexture.height,
      ),
    });

    const background = this.addBackground();
    const logo = this.addLogo();

    // Координаты игрового поля рассчитаны по исходному PNG; обрезанный спрайт начинается после левого отступа.
    const boardWidth = frameTexture.width * FRAME_SCALE * 0.65;
    const windowCenterX =
      ((REELS_WINDOW_LEFT + REELS_WINDOW_RIGHT) / 2 - FRAME_TRANSPARENT_LEFT) * FRAME_SCALE;
    this.reelsBoard = new ReelsBoard(boardWidth, background.height * 0.57, initialReels);
    this.reelsBoard.position.set(windowCenterX - boardWidth / 2, background.height * 0.23);

    logo.anchor.set(0.5, 0);
    logo.position.x = (frameTexture.width / 2 - FRAME_TRANSPARENT_LEFT) * FRAME_SCALE;

    this.addChild(background, this.reelsBoard, logo);

    const bounds = this.getLocalBounds();
    this.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2.2);
  }

  setSymbols(reels: ReelsMatrix): void {
    this.reelsBoard.setSymbols(reels);
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    super.destroy(options);
    this.croppedFrameTexture.destroy();
  }

  private addBackground(): Sprite {
    const frameBackground = new Sprite(this.croppedFrameTexture);
    frameBackground.label = 'reel-frame-filled-background';
    frameBackground.scale.set(FRAME_SCALE);

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
