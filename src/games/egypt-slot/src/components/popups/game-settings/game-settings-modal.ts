import { gsap } from 'gsap';
import { autorun, type IReactionDisposer } from 'mobx';
import { Container, Graphics, Rectangle } from 'pixi.js';
import type { SlotStore } from '../../../stores/SlotStore';
import { ScrollModalBackground } from '../scroll-modal-background';
import { ScrollModalCloseButton } from '../scroll-modal-close-button';
import { SCROLL_MODAL_COLORS } from '../scroll-modal-theme';
import { DemoSettingsSection } from './DemoSettingsSection';
import { SpinSettingsSection } from './SpinSettingsSection';
import {
  SETTINGS_COLUMN_GAP,
  SETTINGS_MARGIN,
  SETTINGS_PADDING_TOP,
  SETTINGS_PADDING_X,
  getSettingsLayout,
} from './settings-layout';
import { settingsText } from './settings-text';

export class GameSettingsModal extends Container {
  private readonly backdrop = new Graphics();
  private readonly surface = new Container();
  private readonly card = new ScrollModalBackground();
  private readonly dividers = new Graphics();
  private readonly heading = settingsText('SETTINGS', 24, SCROLL_MODAL_COLORS.heading);
  private readonly subtitle = settingsText('Choose how the game plays', 12);
  private readonly spinSettings: SpinSettingsSection;
  private readonly demoSettings: DemoSettingsSection;
  private readonly closeButton = new ScrollModalCloseButton(() => this.close());
  private readonly stopObserving: IReactionDisposer;
  private animation: gsap.core.Timeline | null = null;
  private targetScale = 1;
  private wide = true;
  private opened = false;

  constructor(store: SlotStore) {
    super();
    this.label = 'game-settings-modal';
    this.visible = false;
    this.eventMode = 'none';

    this.backdrop.eventMode = 'static';
    this.backdrop.cursor = 'pointer';
    this.backdrop.on('pointertap', () => this.close());
    this.dividers.eventMode = 'none';
    this.heading.anchor.set(0, 0.5);
    this.subtitle.anchor.set(0, 0.5);
    this.spinSettings = new SpinSettingsSection(store);
    this.demoSettings = new DemoSettingsSection(store);

    this.surface.addChild(
      this.card,
      this.dividers,
      this.heading,
      this.subtitle,
      this.spinSettings,
      this.demoSettings,
      this.closeButton,
    );
    this.addChild(this.backdrop, this.surface);
    this.layoutContent(true);
    this.stopObserving = autorun(() => {
      this.spinSettings.update();
      this.demoSettings.update();
    });
  }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.animation?.kill();
    this.visible = true;
    this.eventMode = 'static';
    this.backdrop.alpha = 0;
    this.surface.alpha = 0;
    this.surface.scale.set(this.targetScale * 0.96);
    window.addEventListener('keydown', this.onKeyDown);

    this.animation = gsap.timeline({ onComplete: () => (this.animation = null) });
    this.animation
      .to(this.backdrop, { alpha: 1, duration: 0.25, ease: 'power2.out' }, 0)
      .to(this.surface, { alpha: 1, duration: 0.3, ease: 'power2.out' }, 0)
      .to(
        this.surface.scale,
        { x: this.targetScale, y: this.targetScale, duration: 0.3, ease: 'power2.out' },
        0,
      );
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
      .to(this.backdrop, { alpha: 0, duration: 0.2, ease: 'power2.inOut' }, 0)
      .to(this.surface, { alpha: 0, duration: 0.2, ease: 'power2.inOut' }, 0)
      .to(
        this.surface.scale,
        {
          x: this.targetScale * 0.97,
          y: this.targetScale * 0.97,
          duration: 0.2,
          ease: 'power2.inOut',
        },
        0,
      );
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    const wide = width >= 620;
    if (wide !== this.wide) this.layoutContent(wide);
    const layout = getSettingsLayout(wide);
    this.backdrop.clear().rect(0, 0, width, height).fill({ color: 0x09030f, alpha: 0.72 });
    this.backdrop.hitArea = new Rectangle(0, 0, width, height);
    this.surface.position.set(width / 2, height / 2);
    this.targetScale = Math.min(
      1,
      (width - SETTINGS_MARGIN * 2) / layout.width,
      (height - SETTINGS_MARGIN * 2) / layout.height,
    );
    if (!this.animation) this.surface.scale.set(this.targetScale);
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.animation?.kill();
    window.removeEventListener('keydown', this.onKeyDown);
    this.stopObserving();
    super.destroy(options);
  }

  private layoutContent(wide: boolean): void {
    this.wide = wide;
    const layout = getSettingsLayout(wide);
    this.card.resize(layout.width, layout.height);
    this.surface.pivot.set(layout.width / 2, layout.height / 2);
    this.heading.position.set(SETTINGS_PADDING_X, SETTINGS_PADDING_TOP);
    this.subtitle.position.set(SETTINGS_PADDING_X, SETTINGS_PADDING_TOP + 28);
    this.closeButton.position.set(layout.width - SETTINGS_PADDING_X, SETTINGS_PADDING_TOP);
    this.spinSettings.position.set(SETTINGS_PADDING_X, wide ? 149 : 141);
    this.spinSettings.layout(wide, layout.sectionWidth);
    this.demoSettings.position.set(wide ? layout.rightX : SETTINGS_PADDING_X, wide ? 149 : 620);
    this.demoSettings.layout(wide, layout.sectionWidth);
    this.drawDividers(wide, layout.width, layout.columnWidth, layout.rightX);
  }

  private drawDividers(wide: boolean, width: number, columnWidth: number, rightX: number): void {
    const line = (x1: number, y1: number, x2: number, y2: number): void => {
      this.dividers
        .moveTo(x1, y1)
        .lineTo(x2, y2)
        .stroke({ color: SCROLL_MODAL_COLORS.buttonBorder, width: 1, alpha: 0.55 });
    };
    this.dividers.clear();
    line(SETTINGS_PADDING_X, 120, width - SETTINGS_PADDING_X, 120);
    if (wide) {
      const middle = SETTINGS_PADDING_X + columnWidth + SETTINGS_COLUMN_GAP / 2;
      line(middle, 141, middle, 665);
      line(SETTINGS_PADDING_X, 257, SETTINGS_PADDING_X + columnWidth, 257);
      line(SETTINGS_PADDING_X, 356, SETTINGS_PADDING_X + columnWidth, 356);
      line(rightX, 260, rightX + columnWidth, 260);
      line(rightX, 410, rightX + columnWidth, 410);
    } else {
      for (const y of [243, 338, 595, 711, 831]) {
        line(SETTINGS_PADDING_X, y, width - SETTINGS_PADDING_X, y);
      }
    }
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.close();
  };
}
