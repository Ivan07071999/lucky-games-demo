import { Container } from 'pixi.js';
import { AUTO_PLAY_COUNTS, type AutoPlayStore } from '../../../stores/AutoPlayStore';
import { SCROLL_MODAL_COLORS } from '../scroll-modal-theme';
import { AutoPlayButton } from './AutoPlayButton';
import { makeAutoPlayText } from './auto-play-text';

export class SpinCountSection extends Container {
  private readonly store: AutoPlayStore;
  private readonly heading = makeAutoPlayText('NUMBER OF SPINS', 15, SCROLL_MODAL_COLORS.heading);
  private readonly buttons: AutoPlayButton[];

  constructor(store: AutoPlayStore) {
    super();
    this.store = store;
    this.buttons = AUTO_PLAY_COUNTS.map(
      (count) => new AutoPlayButton(String(count), () => store.selectSpins(count), true),
    );
    this.addChild(this.heading, ...this.buttons);
  }

  updateSelection(): void {
    this.buttons.forEach((button, index) => {
      button.setSelected(AUTO_PLAY_COUNTS[index] === this.store.selectedSpins);
    });
  }

  layoutPortrait(width: number, padding: number, compact: boolean): void {
    this.position.set(padding, 95);
    const columns = compact ? 2 : 4;
    const choiceWidth = (width - padding * 2 - 8 * (columns - 1)) / columns;
    this.buttons.forEach((button, index) => {
      button.resize(choiceWidth, 40);
      button.position.set(
        choiceWidth / 2 + (index % columns) * (choiceWidth + 8),
        37 + Math.floor(index / columns) * 48,
      );
    });
  }

  layoutLandscape(leftWidth: number, padding: number): void {
    this.position.set(padding, 84);
    const choiceWidth = (leftWidth - 8) / 2;
    this.buttons.forEach((button, index) => {
      button.resize(choiceWidth, 34);
      button.position.set(
        choiceWidth / 2 + (index % 2) * (choiceWidth + 8),
        18 + Math.floor(index / 2) * 39,
      );
    });
  }
}
