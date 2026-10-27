import { Container, Rectangle, Sprite, Texture } from 'pixi.js';
import { EgyptImageAssetKey } from '../../assets';

const SIZE = 72;

export class InfoButton extends Container {
  private readonly icon = new Sprite(Texture.from(EgyptImageAssetKey.popups.info));

  constructor(onPress: () => void) {
    super();
    this.label = 'game-info-button';
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(-SIZE / 2, -SIZE / 2, SIZE, SIZE);

    this.icon.anchor.set(0.5);
    this.icon.width = SIZE;
    this.icon.height = SIZE;
    this.addChild(this.icon);

    this.on('pointertap', (event) => {
      event.stopPropagation();
      onPress();
    });
    this.on('pointerover', () => {
      this.icon.width = SIZE * 1.05;
      this.icon.height = SIZE * 1.05;
    });
    this.on('pointerout', () => {
      this.icon.width = SIZE;
      this.icon.height = SIZE;
    });
  }
}
