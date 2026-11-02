import { autorun, type IReactionDisposer } from 'mobx';
import { Container } from 'pixi.js';
import type { AutoPlayStartResult } from '../../../controllers/auto-play-controller/AutoPlayController';
import type { SlotStore } from '../../../stores/SlotStore';
import { fitModalToViewport } from '../shared/modal-layout';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { ScrollModalBackground } from '../shared/ScrollModalBackground';
import { ScrollModalCloseButton } from '../shared/ScrollModalCloseButton';
import { SCROLL_MODAL_COLORS } from '../shared/scroll-modal-theme';
import { AutoPlayFooter } from './AutoPlayFooter';
import { SpinCountSection } from './SpinCountSection';
import { StopConditionsSection } from './StopConditionsSection';
import {
  AUTO_PLAY_CONTENT_PADDING,
  AUTO_PLAY_SIDE_MARGIN,
  getAutoPlayCardLayout,
} from './auto-play-layout';
import { makeAutoPlayText } from './auto-play-text';

export class AutoPlayModal extends Container {
  private readonly store: SlotStore;
  private readonly onStart: () => AutoPlayStartResult;
  private readonly backdrop = new ModalBackdrop(0x08040e, 0.78, () => this.close());
  private readonly content = new Container();
  private readonly card = new ScrollModalBackground();
  private readonly closeButton = new ScrollModalCloseButton(() => this.close());
  private readonly title = makeAutoPlayText('AUTO PLAY', 24, SCROLL_MODAL_COLORS.heading);
  private readonly subtitle = makeAutoPlayText('Automatic spins with the current bet', 12);
  private readonly spinChoices: SpinCountSection;
  private readonly conditions: StopConditionsSection;
  private readonly footer: AutoPlayFooter;
  private readonly stopObserving: IReactionDisposer;
  private viewportWidth = 0;
  private viewportHeight = 0;

  constructor(store: SlotStore, onStart: () => AutoPlayStartResult) {
    super();
    this.store = store;
    this.onStart = onStart;
    this.label = 'auto-play-modal';
    this.visible = false;
    this.eventMode = 'none';

    this.spinChoices = new SpinCountSection(store.autoPlay);
    this.conditions = new StopConditionsSection(store);
    this.footer = new AutoPlayFooter(() => this.start());

    this.addChild(this.backdrop, this.content);
    this.content.addChild(
      this.card,
      this.title,
      this.subtitle,
      this.spinChoices,
      this.conditions,
      this.footer,
      this.closeButton,
    );

    this.stopObserving = autorun(() => {
      this.spinChoices.updateSelection();
      this.conditions.update();
      this.footer.updateSummary(store.bet.bet, store.bet.level);
    });
  }

  open(): boolean {
    if (!this.store.autoPlay.openConfig()) return false;
    this.footer.clearError();
    this.visible = true;
    this.eventMode = 'static';
    this.layout();
    return true;
  }

  close(): void {
    this.visible = false;
    this.eventMode = 'none';
    this.store.autoPlay.closeConfig();
  }

  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.layout();
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.stopObserving();
    super.destroy(options);
  }

  private start(): void {
    const result = this.onStart();
    if (result === 'started') {
      this.close();
      return;
    }
    this.footer.setError(
      result === 'insufficientBalance'
        ? 'Not enough coins for this bet'
        : 'Auto play is unavailable',
    );
  }

  private layout(): void {
    if (this.viewportWidth <= 0 || this.viewportHeight <= 0) return;
    this.backdrop.setViewport(this.viewportWidth, this.viewportHeight);

    const cardLayout = getAutoPlayCardLayout(this.viewportWidth, this.viewportHeight);
    const placement = fitModalToViewport(
      this.viewportWidth,
      this.viewportHeight,
      cardLayout.width,
      cardLayout.height,
      AUTO_PLAY_SIDE_MARGIN,
    );
    this.content.scale.set(placement.scale);
    this.content.position.set(placement.x, placement.y);
    this.card.resize(cardLayout.width, cardLayout.height);
    this.closeButton.position.set(
      cardLayout.width - cardLayout.padding,
      cardLayout.landscape ? 35 : 40,
    );

    if (cardLayout.landscape) {
      this.layoutLandscape(cardLayout.width);
    } else {
      this.layoutPortrait(cardLayout.width, cardLayout.padding, cardLayout.compact);
    }
  }

  private layoutPortrait(width: number, padding: number, compact: boolean): void {
    const lowerOffset = compact ? 48 : 0;
    this.title.position.set(padding, 40);
    this.subtitle.position.set(padding, 66);
    this.spinChoices.layoutPortrait(width, padding, compact);
    this.conditions.layoutPortrait(width, padding, lowerOffset);
    this.footer.layoutPortrait(width, padding, lowerOffset);
  }

  private layoutLandscape(width: number): void {
    const columnGap = 32;
    const leftWidth = (width - AUTO_PLAY_CONTENT_PADDING * 2 - columnGap) / 2;
    const rightX = AUTO_PLAY_CONTENT_PADDING + leftWidth + columnGap;
    this.title.position.set(AUTO_PLAY_CONTENT_PADDING, 35);
    this.subtitle.position.set(AUTO_PLAY_CONTENT_PADDING, 59);
    this.spinChoices.layoutLandscape(leftWidth, AUTO_PLAY_CONTENT_PADDING);
    this.conditions.layoutLandscape(width, rightX, AUTO_PLAY_CONTENT_PADDING);
    this.footer.layoutLandscape(leftWidth, AUTO_PLAY_CONTENT_PADDING);
  }
}
