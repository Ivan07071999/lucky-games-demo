import { Container, Graphics } from 'pixi.js';
import { CancelableTimeline } from '../animation/CancelableTimeline';
import type { ReelsMatrix } from '../reelsConfig';
import { createFreeSpinsTriggerHighlights } from './freeSpinsTriggerHighlights';

export class FreeSpinsTriggerOverlay extends Container {
  private readonly cellWidth: number;
  private readonly cellHeight: number;
  private readonly animation = new CancelableTimeline('Free Spins trigger animation cancelled');
  private currentHighlights: Graphics[] = [];

  constructor(cellWidth: number, cellHeight: number) {
    super();
    this.label = 'free-spins-trigger-overlay';
    this.eventMode = 'none';
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
  }

  async show(reels: ReelsMatrix, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    this.animation.cancel();
    this.clearHighlights(this.currentHighlights);

    const highlights = createFreeSpinsTriggerHighlights(reels, this.cellWidth, this.cellHeight);
    if (highlights.length === 0) return;

    this.currentHighlights = highlights;
    this.addChild(...highlights);
    try {
      await this.animation.run(signal, (timeline) => {
        timeline
          .to(highlights, { alpha: 1, duration: 0.2, stagger: 0.07 })
          .to(
            highlights.map((highlight) => highlight.scale),
            { x: 1.07, y: 1.07, duration: 0.38, repeat: 1, yoyo: true, ease: 'sine.inOut' },
          )
          .to(highlights, { alpha: 0, duration: 0.22 });
      });
    } finally {
      this.clearHighlights(highlights);
    }
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.animation.cancel();
    this.clearHighlights(this.currentHighlights);
    super.destroy(options);
  }

  private clearHighlights(highlights: Graphics[]): void {
    highlights.forEach((highlight) => {
      if (highlight.parent !== this) return;
      this.removeChild(highlight);
      highlight.destroy();
    });
    if (this.currentHighlights === highlights) this.currentHighlights = [];
  }
}
