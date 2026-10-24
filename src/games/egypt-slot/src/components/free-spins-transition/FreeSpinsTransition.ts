import { gsap } from 'gsap';
import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { EgyptImageAssetKey } from '../../assets';

export type FreeSpinsTransitionKind = 'activated' | 'complete';

export class FreeSpinsTransition extends Container {
  private readonly backdrop = new Graphics();
  private readonly artwork = new Sprite();
  private animation: gsap.core.Tween | null = null;
  private viewportWidth = 0;
  private viewportHeight = 0;

  constructor() {
    super();
    this.label = 'free-spins-transition';
    this.visible = false;
    this.eventMode = 'none';
    this.backdrop.eventMode = 'none';
    this.artwork.eventMode = 'none';
    this.artwork.anchor.set(0.5);
    this.addChild(this.backdrop, this.artwork);
    this.on('pointertap', (event) => event.stopPropagation());
  }

  show(kind: FreeSpinsTransitionKind): void {
    this.artwork.texture = Texture.from(
      kind === 'activated'
        ? EgyptImageAssetKey.transitions.freeSpinsActivated
        : EgyptImageAssetKey.transitions.freeSpinsComplete,
    );
    this.layout();
    this.alpha = 0;
    this.visible = true;
    this.eventMode = 'static';
  }

  fadeTo(alpha: number, duration: number, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    return new Promise((resolve, reject) => {
      const onAbort = (): void => {
        this.animation?.kill();
        this.animation = null;
        signal.removeEventListener('abort', onAbort);
        reject(signal.reason ?? new Error('Free Spins transition aborted'));
      };
      this.animation = gsap.to(this, {
        alpha,
        duration,
        ease: 'power1.inOut',
        onComplete: () => {
          this.animation = null;
          signal.removeEventListener('abort', onAbort);
          resolve();
        },
      });
      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted) onAbort();
    });
  }

  hide(): void {
    this.animation?.kill();
    this.animation = null;
    this.visible = false;
    this.eventMode = 'none';
  }

  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.backdrop.clear().rect(0, 0, width, height).fill({ color: 0x0c0613, alpha: 1 });
    this.hitArea = new Rectangle(0, 0, width, height);
    this.layout();
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.animation?.kill();
    this.animation = null;
    super.destroy(options);
  }

  private layout(): void {
    if (!this.artwork.texture.width || !this.viewportWidth || !this.viewportHeight) return;
    const margin = Math.min(24, this.viewportWidth * 0.04, this.viewportHeight * 0.04);
    const scale = Math.min(
      (this.viewportWidth - margin * 2) / this.artwork.texture.width,
      (this.viewportHeight - margin * 2) / this.artwork.texture.height,
    );
    this.artwork.scale.set(scale);
    this.artwork.position.set(this.viewportWidth / 2, this.viewportHeight / 2);
  }
}
