import { gsap } from 'gsap';
import { autorun, type IReactionDisposer } from 'mobx';
import {
  Container,
  Graphics,
  Rectangle,
  Text,
  type FederatedPointerEvent,
  type FederatedWheelEvent,
} from 'pixi.js';
import type { SlotStore } from '../../../stores/SlotStore';
import { GameInfoControlsPage } from './game-info-controls-page';
import { GameInfoPaytablePage } from './game-info-paytable-page';
import { GameInfoRulesPage } from './game-info-rules-page';
import { ScrollModalBackground } from '../scroll-modal-background';
import { ScrollModalCloseButton } from '../scroll-modal-close-button';
import { SCROLL_MODAL_COLORS } from '../scroll-modal-theme';

const PAGE_SUBTITLES = [
  'Symbols pay left to right on adjacent reels, starting from the leftmost reel.',
  'Game rules and all winning lines, including those added in Settings.',
  'BET, SPIN, AUTO PLAY and sound controls.',
] as const;

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

export class GameInfoModal extends Container {
  private readonly backdrop = new Graphics();
  private readonly surface = new Container();
  private readonly card = new ScrollModalBackground();
  private readonly heading = this.makeText('GAME RULES', 36, true);
  private readonly subtitle = this.makeText('', 16);
  private readonly closeButton = new ScrollModalCloseButton(() => this.close());
  private readonly viewport = new Container();
  private readonly pageContent = new Container();
  private readonly clippingArea = new Graphics();
  private readonly paytablePage = new GameInfoPaytablePage();
  private readonly rulesPage = new GameInfoRulesPage();
  private readonly controlsPage = new GameInfoControlsPage();
  private readonly pages = [this.paytablePage, this.rulesPage, this.controlsPage];
  private readonly previousPage = new PageArrow(-1, () => this.setPage(this.pageIndex - 1));
  private readonly nextPage = new PageArrow(1, () => this.setPage(this.pageIndex + 1));
  private readonly pageLabel = this.makeText('1 / 3', 16, true);
  private readonly scrollHint = this.makeText('SCROLL FOR MORE', 12);
  private readonly stopObserving: IReactionDisposer;
  private animation: gsap.core.Timeline | null = null;
  private viewportHeight = 0;
  private cardWidth = 0;
  private cardHeight = 0;
  private pageIndex = 0;
  private pageHeights = [0, 0, 0];
  private visiblePageHeight = 0;
  private scrollY = 0;
  private dragStartY = 0;
  private dragStartScroll = 0;
  private dragging = false;
  private opened = false;

  constructor(store: SlotStore) {
    super();
    this.label = 'game-info-modal';
    this.visible = false;
    this.eventMode = 'none';

    this.backdrop.eventMode = 'static';
    this.backdrop.cursor = 'pointer';
    this.backdrop.on('pointertap', () => this.close());
    this.heading.anchor.set(0.5);
    this.subtitle.anchor.set(0.5, 0);
    this.pageLabel.anchor.set(0.5);
    this.scrollHint.anchor.set(1, 0.5);

    this.viewport.label = 'game-info-page-viewport';
    this.viewport.eventMode = 'static';
    this.pageContent.addChild(...this.pages);
    this.viewport.addChild(this.pageContent, this.clippingArea);
    this.pageContent.mask = this.clippingArea;
    this.viewport.on('wheel', (event: FederatedWheelEvent) => {
      this.setScroll(this.scrollY + event.deltaY);
      event.stopPropagation();
    });
    this.viewport.on('pointerdown', (event: FederatedPointerEvent) => {
      if (this.maxScroll === 0) return;
      this.dragging = true;
      this.dragStartY = this.viewport.toLocal(event.global).y;
      this.dragStartScroll = this.scrollY;
    });
    this.viewport.on('globalpointermove', (event: FederatedPointerEvent) => {
      if (!this.dragging) return;
      const distance = this.viewport.toLocal(event.global).y - this.dragStartY;
      this.setScroll(this.dragStartScroll - distance);
    });
    this.viewport.on('pointerup', this.stopDragging);
    this.viewport.on('pointerupoutside', this.stopDragging);

    this.surface.addChild(
      this.card,
      this.heading,
      this.subtitle,
      this.viewport,
      this.scrollHint,
      this.previousPage,
      this.pageLabel,
      this.nextPage,
      this.closeButton,
    );
    this.addChild(this.backdrop, this.surface);
    this.setPage(0);

    this.stopObserving = autorun(() => {
      const config = store.gameConfig;
      if (!config) return;
      this.paytablePage.setData(config, store.panel.bet, store.panel.level);
      this.rulesPage.setData(config);
      this.layoutPages();
    });
  }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.setPage(0);
    this.animation?.kill();
    this.visible = true;
    this.eventMode = 'static';
    this.backdrop.alpha = 0;
    this.surface.alpha = 0;
    this.surface.scale.set(0.96);
    this.surface.position.y = this.viewportHeight / 2 + 12;
    window.addEventListener('keydown', this.onKeyDown);

    this.animation = gsap.timeline({ onComplete: () => (this.animation = null) });
    this.animation
      .to(this.backdrop, { alpha: 1, duration: 0.28, ease: 'power2.out' }, 0)
      .to(
        this.surface,
        { alpha: 1, y: this.viewportHeight / 2, duration: 0.32, ease: 'power2.out' },
        0,
      )
      .to(this.surface.scale, { x: 1, y: 1, duration: 0.32, ease: 'power2.out' }, 0);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.dragging = false;
    window.removeEventListener('keydown', this.onKeyDown);
    this.animation?.kill();
    this.animation = gsap.timeline({
      onComplete: () => {
        if (!this.opened) {
          this.visible = false;
          this.eventMode = 'none';
        }
        this.animation = null;
      },
    });
    this.animation
      .to(this.backdrop, { alpha: 0, duration: 0.22, ease: 'power2.inOut' }, 0)
      .to(this.surface, { alpha: 0, duration: 0.22, ease: 'power2.inOut' }, 0)
      .to(this.surface.scale, { x: 0.97, y: 0.97, duration: 0.22, ease: 'power2.inOut' }, 0);
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.viewportHeight = height;
    this.backdrop.clear().rect(0, 0, width, height).fill({ color: 0x09030f, alpha: 0.78 });
    this.backdrop.hitArea = new Rectangle(0, 0, width, height);

    const margin = Math.max(12, Math.min(42, Math.min(width, height) * 0.045));
    this.cardWidth = width - margin * 2;
    this.cardHeight = height - margin * 2;
    this.card.resize(this.cardWidth, this.cardHeight);
    this.surface.pivot.set(this.cardWidth / 2, this.cardHeight / 2);
    this.surface.position.set(width / 2, height / 2);

    const compact = this.cardWidth < 700;
    const short = this.cardHeight < 450;
    const padding = Math.min(68, Math.max(32, this.cardWidth * 0.075));
    const headingY = short ? 33 : compact ? 42 : 52;
    const navY = this.cardHeight - (short ? 32 : compact ? 42 : 52);
    const contentWidth = Math.max(1, this.cardWidth - padding * 2);

    this.heading.style.fontSize = short ? 23 : compact ? 25 : 36;
    this.heading.position.set(this.cardWidth / 2, headingY);
    this.subtitle.style.fontSize = compact ? 12 : 16;
    this.subtitle.style.wordWrap = true;
    this.subtitle.style.wordWrapWidth = Math.max(1, contentWidth - 20);
    this.subtitle.position.set(this.cardWidth / 2, headingY + (short ? 20 : 30));
    const activeSubtitle = this.subtitle.text;
    const subtitleHeight = Math.max(
      ...PAGE_SUBTITLES.map((text) => {
        this.subtitle.text = text;
        return this.subtitle.height;
      }),
    );
    this.subtitle.text = activeSubtitle;
    const contentTop = Math.max(
      short ? 76 : compact ? 96 : 108,
      this.subtitle.y + subtitleHeight + 8,
    );
    this.visiblePageHeight = Math.max(1, navY - contentTop - (short ? 20 : 26));
    this.closeButton.position.set(this.cardWidth - padding * 0.65, headingY);

    this.viewport.position.set(padding, contentTop);
    this.viewport.hitArea = new Rectangle(0, 0, contentWidth, this.visiblePageHeight);
    this.clippingArea.clear().rect(0, 0, contentWidth, this.visiblePageHeight).fill(0xffffff);
    this.scrollHint.position.set(this.cardWidth - padding, navY - (short ? 28 : 42));
    this.previousPage.position.set(this.cardWidth / 2 - 78, navY);
    this.pageLabel.position.set(this.cardWidth / 2, navY);
    this.nextPage.position.set(this.cardWidth / 2 + 78, navY);
    this.layoutPages();
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.animation?.kill();
    window.removeEventListener('keydown', this.onKeyDown);
    this.stopObserving();
    super.destroy(options);
  }

  private layoutPages(): void {
    if (!this.cardWidth) return;
    const contentWidth =
      this.viewport.hitArea instanceof Rectangle ? this.viewport.hitArea.width : 0;
    const paytableHeight = this.paytablePage.layout(contentWidth);
    const paytableScale = Math.min(1, this.visiblePageHeight / Math.max(1, paytableHeight));
    this.paytablePage.scale.set(paytableScale);
    this.paytablePage.position.set(
      (contentWidth * (1 - paytableScale)) / 2,
      Math.max(0, (this.visiblePageHeight - paytableHeight * paytableScale) / 2),
    );
    this.pageHeights[0] = paytableHeight * paytableScale;
    const rulesHeight = this.rulesPage.layout(contentWidth);
    const rulesScale = Math.min(1, this.visiblePageHeight / Math.max(1, rulesHeight));
    this.rulesPage.scale.set(rulesScale);
    this.rulesPage.position.set(
      (contentWidth * (1 - rulesScale)) / 2,
      Math.max(0, (this.visiblePageHeight - rulesHeight * rulesScale) / 2),
    );
    this.pageHeights[1] = rulesHeight * rulesScale;
    const controlsHeight = this.controlsPage.layout(contentWidth);
    const controlsScale = Math.min(1, this.visiblePageHeight / Math.max(1, controlsHeight));
    this.controlsPage.scale.set(controlsScale);
    this.controlsPage.position.set(
      (contentWidth * (1 - controlsScale)) / 2,
      Math.max(0, (this.visiblePageHeight - controlsHeight * controlsScale) / 2),
    );
    this.pageHeights[2] = controlsHeight * controlsScale;
    this.setScroll(this.scrollY);
  }

  private setPage(index: number): void {
    if (index < 0 || index >= this.pages.length) return;
    this.pageIndex = index;
    this.pages.forEach((page, pageIndex) => {
      page.visible = pageIndex === index;
    });
    this.subtitle.text = PAGE_SUBTITLES[index];
    this.previousPage.setEnabled(index > 0);
    this.nextPage.setEnabled(index < this.pages.length - 1);
    this.pageLabel.text = `${index + 1} / ${this.pages.length}`;
    this.setScroll(0);
  }

  private get maxScroll(): number {
    if (this.pageIndex === 0 || this.pageIndex === 2) return 0;
    return Math.max(0, this.pageHeights[this.pageIndex] - this.visiblePageHeight);
  }

  private setScroll(value: number): void {
    this.scrollY = Math.max(0, Math.min(this.maxScroll, value));
    this.pageContent.y = -this.scrollY;
    this.scrollHint.visible = this.maxScroll > 0;
  }

  private readonly stopDragging = (): void => {
    this.dragging = false;
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.close();
    if (event.key === 'ArrowLeft') this.setPage(this.pageIndex - 1);
    if (event.key === 'ArrowRight') this.setPage(this.pageIndex + 1);
  };

  private makeText(text: string, fontSize: number, bold = false): Text {
    return new Text({
      text,
      style: {
        fontFamily: 'Manrope Variable, sans-serif',
        fontSize,
        fontWeight: bold ? '800' : '600',
        fill: bold ? SCROLL_MODAL_COLORS.heading : SCROLL_MODAL_COLORS.ink,
      },
    });
  }
}
