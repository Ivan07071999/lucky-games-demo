import { Container, Sprite, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { EgyptImageAssetKey } from '../assets';
import type { ReelSymbolKey } from './reelsConfig';

export class ReelSymbol extends Container {
  private readonly image: Sprite;
  private readonly cellWidth: number;
  private readonly cellHeight: number;

  constructor(width: number, height: number, symbol: ReelSymbolKey) {
    super();

    this.cellWidth = width;
    this.cellHeight = height;
    this.label = 'reel-symbol';

    this.image = new Sprite();
    this.image.anchor.set(0.5);
    this.image.position.set(width / 2, height / 2);
    this.addChild(this.image);
    this.setValue(symbol);
  }

  setValue(symbol: ReelSymbolKey): void {
    const texture = Texture.from(EgyptImageAssetKey.symbols[symbol]);
    this.image.texture = texture;
    this.image.label = `symbol-${symbol}`;
    this.image.scale.set(
      Math.min((this.cellWidth * 1.08) / texture.width, (this.cellHeight * 1.08) / texture.height),
    );
  }

  async pulse(signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      let tween: gsap.core.Tween | null = null;
      const onAbort = () => {
        tween?.kill();
        this.image.alpha = 1;
        reject(signal.reason ?? new Error('Win animation cancelled'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
      tween = gsap.to(this.image, {
        alpha: 0.4,
        duration: 0.18,
        repeat: 1,
        yoyo: true,
        onComplete: () => {
          signal.removeEventListener('abort', onAbort);
          this.image.alpha = 1;
          resolve();
        },
      });
      if (signal.aborted) onAbort();
    });
  }

  async emphasizeWild(signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    const scale = this.image.scale.x;
    await new Promise<void>((resolve, reject) => {
      let tween: gsap.core.Tween | null = null;
      const onAbort = () => {
        tween?.kill();
        this.image.scale.set(scale);
        reject(signal.reason ?? new Error('Wild animation cancelled'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
      tween = gsap.to(this.image.scale, {
        x: scale * 1.14,
        y: scale * 1.14,
        duration: 0.22,
        repeat: 1,
        yoyo: true,
        ease: 'power2.out',
        onComplete: () => {
          signal.removeEventListener('abort', onAbort);
          this.image.scale.set(scale);
          resolve();
        },
      });
      if (signal.aborted) onAbort();
    });
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    gsap.killTweensOf(this.image);
    gsap.killTweensOf(this.image.scale);
    super.destroy(options);
  }
}
