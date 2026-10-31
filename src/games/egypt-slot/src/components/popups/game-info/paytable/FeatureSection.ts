import type { SlotState } from '@lucky-games/contracts';
import { Container, Graphics } from 'pixi.js';
import { SCROLL_MODAL_COLORS } from '../../shared/scroll-modal-theme';
import { FeatureCard } from './FeatureCard';
import type { PaytableLayout } from './paytable-layout';
import { formatScarabDescription, formatWildDescription } from './paytable-text';

export class FeatureSection extends Container {
  private readonly divider = new Graphics();
  private readonly wild = new FeatureCard('wild', 'WILD');
  private readonly scarab = new FeatureCard('highScarab', 'SCARAB');

  constructor() {
    super();
    this.addChild(this.divider, this.wild, this.scarab);
  }

  setData(config: SlotState['config']): void {
    this.wild.setDescription(formatWildDescription(config.wildMultiplier));
    this.scarab.setDescription(
      formatScarabDescription(config.scatterTriggerCount, config.freeSpinsAwarded),
    );
  }

  layout(width: number, gridBottom: number, preset: PaytableLayout): number {
    this.position.y = gridBottom;
    const featureTop = preset.featureTopGap;
    this.divider
      .clear()
      .rect(0, featureTop - preset.dividerOffset, width, 1)
      .fill({ color: SCROLL_MODAL_COLORS.buttonBorder, alpha: 0.55 });
    const featureWidth = Math.max(1, (width - preset.featureGap) / 2);
    const wildHeight = this.wild.layout(featureWidth, preset);
    const scarabHeight = this.scarab.layout(featureWidth, preset);
    this.wild.position.set(0, featureTop);
    this.scarab.position.set(featureWidth + preset.featureGap, featureTop);
    return gridBottom + featureTop + Math.max(wildHeight, scarabHeight) + preset.pageBottomGap;
  }
}
