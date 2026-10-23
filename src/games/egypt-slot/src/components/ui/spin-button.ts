import { Sprite, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { EgyptImageAssetKey } from '../../assets';
import { Button } from './button';

export class SpinButton extends Button {
  private readonly image: Sprite;
  private readonly diameter: number;
  private isSpinning = false;

  constructor(radius: number, onSpin?: () => void) {
    super(radius, onSpin);

    this.diameter = radius * 2;
    this.image = new Sprite(Texture.from(EgyptImageAssetKey.buttons.spinButton));
    this.image.label = 'spin-button-image';
    this.image.anchor.set(0.5);
    this.image.setSize(this.diameter);
    this.addChild(this.image);

    this.on('pointerover', this.rotateOnHover, this);
    this.on('pointerout', this.resetRotation, this);
  }

  setSpinning(isSpinning: boolean): void {
    if (this.isSpinning === isSpinning) return;
    this.isSpinning = isSpinning;
    const textureKey = isSpinning
      ? EgyptImageAssetKey.buttons.spinningButton
      : EgyptImageAssetKey.buttons.spinButton;

    gsap.killTweensOf(this.image);
    this.image.rotation = 0;
    this.image.texture = Texture.from(textureKey);
    this.image.setSize(this.diameter);
  }

  private rotateOnHover(): void {
    if (this.isSpinning) return;

    gsap.killTweensOf(this.image);
    gsap.to(this.image, {
      rotation: (40 * Math.PI) / 180,
      duration: 0.3,
      ease: 'power2.out',
    });
  }

  private resetRotation(): void {
    gsap.killTweensOf(this.image);
    if (this.isSpinning) {
      this.image.rotation = 0;
      return;
    }

    gsap.to(this.image, {
      rotation: 0,
      duration: 0.2,
      ease: 'power2.out',
    });
  }

  override destroy(options?: Parameters<Sprite['destroy']>[0]): void {
    gsap.killTweensOf(this.image);
    super.destroy(options);
  }
}
