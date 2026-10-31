import { Sprite, Texture } from 'pixi.js';
import { EgyptImageAssetKey } from '../../../assets';
import type { SceneTheme } from '../../../scene/sceneTheme';

export class PanelBackground extends Sprite {
  constructor(label: string, sceneHeight: number) {
    super(Texture.from(EgyptImageAssetKey.buttons.panelBackground));
    this.label = label;
    this.anchor.set(0.5);
    this.height = sceneHeight * 0.15;
    this.width = this.height * (this.texture.width / this.texture.height);
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
