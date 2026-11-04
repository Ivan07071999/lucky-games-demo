import { Rectangle, Sprite, Texture } from 'pixi.js';
import { EgyptImageAssetKey } from '../assets';
import type { SceneTheme } from '../scene/sceneTheme';
import { REELS_FRAME_LAYOUT, type FrameSize } from './reelsMachineLayout';

export class ReelsFrameView {
  readonly background: Sprite;
  readonly logo: Sprite;

  private readonly frameTextures: Record<SceneTheme, Texture>;
  private readonly baseSourceSize: FrameSize;

  private theme: SceneTheme = 'base';

  constructor() {
    const baseSource = Texture.from(EgyptImageAssetKey.scene.reelFrameFilled);
    const freeSpinsSource = Texture.from(EgyptImageAssetKey.scene.reelFrameFreeSpins);

    this.baseSourceSize = { width: baseSource.width, height: baseSource.height };
    this.frameTextures = {
      base: this.cropBaseFrame(baseSource),
      freeSpins: this.cropFreeSpinsFrame(freeSpinsSource),
    };

    this.background = new Sprite(this.frameTextures.base);
    this.background.label = 'reel-frame-filled-background';
    this.positionBaseFrame();

    this.logo = new Sprite(Texture.from(EgyptImageAssetKey.scene.logoLong));
    this.logo.label = 'logo-frame';
    this.logo.scale.set(0.25);
    this.logo.anchor.set(0.5, 0);
    this.logo.position.set(
      (baseSource.width / 2 - REELS_FRAME_LAYOUT.transparentLeft) * REELS_FRAME_LAYOUT.scale,
      this.background.position.y,
    );
  }

  getBaseSourceSize(): FrameSize {
    return { ...this.baseSourceSize };
  }

  getBaseFrameSize(): FrameSize {
    const baseFrame = this.frameTextures.base;
    return { width: baseFrame.width, height: baseFrame.height };
  }

  setTheme(theme: SceneTheme): void {
    if (this.theme === theme) return;

    this.theme = theme;
    this.background.texture = this.frameTextures[theme];

    if (theme === 'freeSpins') {
      this.background.scale.set(
        REELS_FRAME_LAYOUT.freeSpinsScaleX,
        REELS_FRAME_LAYOUT.freeSpinsScaleY,
      );
      this.background.position.set(
        (this.frameTextures.base.width * REELS_FRAME_LAYOUT.scale -
          this.frameTextures.freeSpins.width * REELS_FRAME_LAYOUT.freeSpinsScaleX) /
          2,
        REELS_FRAME_LAYOUT.freeSpinsY,
      );
    } else {
      this.positionBaseFrame();
    }

    this.logo.visible = theme === 'base';
  }

  destroy(): void {
    this.frameTextures.base.destroy();
    this.frameTextures.freeSpins.destroy();
  }

  private cropBaseFrame(source: Texture): Texture {
    return new Texture({
      source: source.source,
      frame: new Rectangle(
        REELS_FRAME_LAYOUT.transparentLeft,
        0,
        source.width - REELS_FRAME_LAYOUT.transparentLeft - REELS_FRAME_LAYOUT.transparentRight,
        source.height,
      ),
    });
  }

  private cropFreeSpinsFrame(source: Texture): Texture {
    const side = REELS_FRAME_LAYOUT.freeSpinsTransparentSide;

    return new Texture({
      source: source.source,
      frame: new Rectangle(side, 0, source.width - side * 2, source.height),
    });
  }

  private positionBaseFrame(): void {
    const baseFrame = this.frameTextures.base;

    this.background.scale.set(REELS_FRAME_LAYOUT.baseScaleX, REELS_FRAME_LAYOUT.baseScaleY);
    this.background.position.set(
      (baseFrame.width * (REELS_FRAME_LAYOUT.scale - REELS_FRAME_LAYOUT.baseScaleX)) / 2,
      (baseFrame.height * (REELS_FRAME_LAYOUT.scale - REELS_FRAME_LAYOUT.baseScaleY)) / 2,
    );
  }
}
