import { Sprite, Texture } from 'pixi.js';
import { EgyptImageAssetKey } from '../../../assets';
import type { SceneTheme } from '../../../scene/sceneTheme';

export class PanelBackground extends Sprite {
  private readonly baseWidth: number;
  private readonly baseHeight: number;

  constructor(label: string, sceneHeight: number) {
    super(Texture.from(EgyptImageAssetKey.buttons.panelBackground));
    this.label = label;
    this.anchor.set(0.5);
    this.baseHeight = sceneHeight * 0.15;
    this.baseWidth = this.baseHeight * (this.texture.width / this.texture.height);
    this.setResponsiveScale(1);
  }

  setResponsiveScale(scale: number, widthScale = 1): void {
    this.width = this.baseWidth * scale * widthScale;
    this.height = this.baseHeight * scale;
  }

  setTheme(theme: SceneTheme): void {
    const { width, height } = this;
    this.texture = Texture.from(
      theme === 'freeSpins'
        ? EgyptImageAssetKey.buttons.panelBackgroundFreeSpins
        : EgyptImageAssetKey.buttons.panelBackground,
    );
    this.width = width;
    this.height = height;
  }
}
