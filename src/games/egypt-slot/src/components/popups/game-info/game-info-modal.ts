import { gsap } from 'gsap';
import { autorun, type IReactionDisposer } from 'mobx';
import { Container, Text } from 'pixi.js';
import type { SlotStore } from '../../../stores/SlotStore';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { ScrollModalBackground } from '../shared/ScrollModalBackground';
import { ScrollModalCloseButton } from '../shared/ScrollModalCloseButton';
import { SCROLL_MODAL_COLORS, SCROLL_MODAL_FONT_FAMILY } from '../shared/scroll-modal-theme';
import { GameInfoControlsPage } from './game-info-controls-page';
import { GameInfoPaytablePage } from './game-info-paytable-page';
import { GameInfoRulesPage } from './game-info-rules-page';
import { InfoPageHost } from './InfoPageHost';
import { InfoPagination } from './InfoPagination';

const PAGE_SUBTITLES = [
  'Symbols pay left to right on adjacent reels, starting from the leftmost reel.',
  'Game rules and all winning lines, including those added in Settings.',
  'BET, SPIN, AUTO PLAY and sound controls.',
] as const;

export class GameInfoModal extends Container {
  private readonly backdrop = new ModalBackdrop(0x09030f, 0.78, () => this.close());
  private readonly surface = new Container();
  private readonly card = new ScrollModalBackground();
  private readonly heading = this.makeText('GAME RULES', 36, true);
  private readonly subtitle = this.makeText('', 16);
  private readonly closeButton = new ScrollModalCloseButton(() => this.close());
  private readonly paytablePage = new GameInfoPaytablePage();
  private readonly rulesPage = new GameInfoRulesPage();
  private readonly controlsPage = new GameInfoControlsPage();
  private readonly pageHost = new InfoPageHost([
    this.paytablePage,
    this.rulesPage,
    this.controlsPage,
  ]);
  private readonly pagination = new InfoPagination((direction) =>
    this.setPage(this.pageIndex + direction),
  );
  private readonly stopObserving: IReactionDisposer;
  private animation: gsap.core.Timeline | null = null;
  private viewportHeight = 0;
  private pageIndex = 0;
  private opened = false;

  constructor(store: SlotStore) {
    super();
    this.label = 'game-info-modal';
    this.visible = false;
    this.eventMode = 'none';
    this.heading.anchor.set(0.5);
    this.subtitle.anchor.set(0.5, 0);
    this.pageHost.label = 'game-info-page-viewport';

    this.surface.addChild(
      this.card,
      this.heading,
      this.subtitle,
      this.pageHost,
      this.pagination,
      this.closeButton,
    );
    this.addChild(this.backdrop, this.surface);
    this.setPage(0);

    this.stopObserving = autorun(() => {
      const config = store.gameConfig;
      if (!config) return;
      this.paytablePage.setData(config, store.bet.bet, store.bet.level);
      this.rulesPage.setData(config);
      this.pageHost.layoutPages();
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
    this.backdrop.setViewport(width, height);

    const margin = Math.max(12, Math.min(42, Math.min(width, height) * 0.045));
    const cardWidth = width - margin * 2;
    const cardHeight = height - margin * 2;
    this.card.resize(cardWidth, cardHeight);
    this.surface.pivot.set(cardWidth / 2, cardHeight / 2);
    this.surface.position.set(width / 2, height / 2);

    const compact = cardWidth < 700;
    const short = cardHeight < 450;
    const padding = Math.min(68, Math.max(32, cardWidth * 0.075));
    const headingY = short ? 33 : compact ? 42 : 52;
    const navY = cardHeight - (short ? 32 : compact ? 42 : 52);
    const contentWidth = Math.max(1, cardWidth - padding * 2);

    this.heading.style.fontSize = short ? 23 : compact ? 25 : 36;
    this.heading.position.set(cardWidth / 2, headingY);
    this.subtitle.style.fontSize = compact ? 12 : 16;
    this.subtitle.style.wordWrap = true;
    this.subtitle.style.wordWrapWidth = Math.max(1, contentWidth - 20);
    this.subtitle.position.set(cardWidth / 2, headingY + (short ? 20 : 30));
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
    const visiblePageHeight = Math.max(1, navY - contentTop - (short ? 20 : 26));
    this.closeButton.position.set(cardWidth - padding * 0.65, headingY);
    this.pageHost.position.set(padding, contentTop);
    this.pageHost.setViewport(contentWidth, visiblePageHeight);
    this.pagination.position.set(cardWidth / 2, navY);
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.animation?.kill();
    window.removeEventListener('keydown', this.onKeyDown);
    this.stopObserving();
    super.destroy(options);
  }

  private setPage(index: number): void {
    if (index < 0 || index >= PAGE_SUBTITLES.length) return;
    this.pageIndex = index;
    this.pageHost.showPage(index);
    this.subtitle.text = PAGE_SUBTITLES[index];
    this.pagination.setPage(index, PAGE_SUBTITLES.length);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.close();
    if (event.key === 'ArrowLeft') this.setPage(this.pageIndex - 1);
    if (event.key === 'ArrowRight') this.setPage(this.pageIndex + 1);
  };

  private makeText(text: string, fontSize: number, bold = false): Text {
    return new Text({
      text,
      style: {
        fontFamily: SCROLL_MODAL_FONT_FAMILY,
        fontSize,
        fontWeight: bold ? '800' : '600',
        fill: bold ? SCROLL_MODAL_COLORS.heading : SCROLL_MODAL_COLORS.ink,
      },
    });
  }
}
