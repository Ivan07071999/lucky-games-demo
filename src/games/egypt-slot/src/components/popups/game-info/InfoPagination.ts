import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { SCROLL_MODAL_COLORS, SCROLL_MODAL_FONT_FAMILY } from '../shared/scroll-modal-theme';

class PageArrow extends Container {
  private readonly icon = new Graphics();
  private enabled = true;

  constructor(direction: -1 | 1, onPress: () => void) {
    super();
    this.label = direction < 0 ? 'game-info-previous-page' : 'game-info-next-page';
    this.eventMode = 'static';
    this.hitArea = new Rectangle(-25, -25, 50, 50);
    this.addChild(this.icon);
    this.icon
      .circle(0, 0, 20)
      .fill({ color: SCROLL_MODAL_COLORS.buttonBorder, alpha: 0.16 })
      .stroke({ color: SCROLL_MODAL_COLORS.buttonBorder, width: 2 })
      .moveTo(-direction * 5, -8)
      .lineTo(direction * 4, 0)
      .lineTo(-direction * 5, 8)
      .stroke({ color: SCROLL_MODAL_COLORS.heading, width: 3 });
    this.on('pointertap', (event) => {
      event.stopPropagation();
      if (this.enabled) onPress();
    });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.alpha = enabled ? 1 : 0.35;
    this.cursor = enabled ? 'pointer' : 'default';
  }
}

export class InfoPagination extends Container {
  private readonly previous: PageArrow;
  private readonly next: PageArrow;
  private readonly pageLabel = new Text({
    text: '1 / 3',
    style: {
      fontFamily: SCROLL_MODAL_FONT_FAMILY,
      fontSize: 16,
      fontWeight: '800',
      fill: SCROLL_MODAL_COLORS.heading,
    },
  });

  constructor(onChange: (direction: -1 | 1) => void) {
    super();
    this.previous = new PageArrow(-1, () => onChange(-1));
    this.next = new PageArrow(1, () => onChange(1));
    this.previous.position.x = -78;
    this.next.position.x = 78;
    this.pageLabel.anchor.set(0.5);
    this.addChild(this.previous, this.pageLabel, this.next);
  }

  setPage(index: number, total: number): void {
    this.previous.setEnabled(index > 0);
    this.next.setEnabled(index < total - 1);
    this.pageLabel.text = `${index + 1} / ${total}`;
  }
}
