import { Container, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import type { ReelsMatrix } from './reelsConfig';

export class FreeSpinsTriggerOverlay extends Container {
  private readonly cellWidth: number;
  private readonly cellHeight: number;
  private timeline: gsap.core.Timeline | null = null;
  private cancelAnimation: (() => void) | null = null;

  constructor(cellWidth: number, cellHeight: number) {
    super();
    this.label = 'free-spins-trigger-overlay';
    this.eventMode = 'none';
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
  }

  async show(reels: ReelsMatrix, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    this.cancelAnimation?.();
    this.clear();

    const highlights: Graphics[] = [];
    reels.forEach((symbols, reelIndex) => {
      symbols.forEach((symbol, rowIndex) => {
        if (symbol !== 'highScarab') return;
        const padding = Math.min(this.cellWidth, this.cellHeight) * 0.08;
        const width = this.cellWidth - padding * 2;
        const height = this.cellHeight - padding * 2;
        const highlight = new Graphics()
          .roundRect(-width / 2, -height / 2, width, height, 12)
          .fill({ color: 0xffd879, alpha: 0.12 })
          .stroke({ color: 0xffe6a1, width: 3, alpha: 0.95 });
        highlight.position.set(
          (reelIndex + 0.5) * this.cellWidth,
          (rowIndex + 0.5) * this.cellHeight,
        );
        highlight.alpha = 0;
        highlights.push(highlight);
        this.addChild(highlight);
      });
    });

    if (highlights.length === 0) return;

    await new Promise<void>((resolve, reject) => {
      const onAbort = (): void => {
        signal.removeEventListener('abort', onAbort);
        this.timeline?.kill();
        this.timeline = null;
        this.cancelAnimation = null;
        this.clear();
        reject(signal.reason ?? new Error('Free Spins trigger animation cancelled'));
      };
      this.cancelAnimation = onAbort;
      signal.addEventListener('abort', onAbort, { once: true });
      this.timeline = gsap.timeline({
        onComplete: () => {
          signal.removeEventListener('abort', onAbort);
          this.timeline = null;
          this.cancelAnimation = null;
          this.clear();
          resolve();
        },
      });
      this.timeline
        .to(highlights, { alpha: 1, duration: 0.2, stagger: 0.07 })
        .to(
          highlights.map((highlight) => highlight.scale),
          { x: 1.07, y: 1.07, duration: 0.38, repeat: 1, yoyo: true, ease: 'sine.inOut' },
        )
        .to(highlights, { alpha: 0, duration: 0.22 });
      if (signal.aborted) onAbort();
    });
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.cancelAnimation?.();
    super.destroy(options);
  }

  private clear(): void {
    this.removeChildren().forEach((child) => child.destroy());
  }
}
