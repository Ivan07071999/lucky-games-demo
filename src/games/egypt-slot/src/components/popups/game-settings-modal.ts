import { gsap } from 'gsap';
import { autorun, type IReactionDisposer } from 'mobx';
import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { PAYLINE_COUNTS, WIN_DEMO_TYPES } from '@lucky-games/contracts';
import type { SlotStore } from '../../stores/SlotStore';
import { ScrollModalBackground } from './scroll-modal-background';
import { ScrollModalCloseButton } from './scroll-modal-close-button';
import { SCROLL_MODAL_COLORS } from './scroll-modal-theme';
import { SettingsCheckbox } from './settings-checkbox';
import { WinDemoPicker } from './win-demo-picker';

const MODAL_WIDTH = 680;
const MODAL_HEIGHT = 720;
const NARROW_MODAL_WIDTH = 460;
const NARROW_MODAL_HEIGHT = 1015;
const MODAL_MARGIN = 16;
const CONTENT_PADDING_X = 52;
const CONTENT_PADDING_TOP = 64;

export class GameSettingsModal extends Container {
  readonly turboCheckbox: SettingsCheckbox;
  readonly anticipationCheckbox: SettingsCheckbox;
  readonly classicCheckbox: SettingsCheckbox;
  readonly cascadeCheckbox: SettingsCheckbox;
  readonly hybridCheckbox: SettingsCheckbox;
  readonly winDemoCheckbox: SettingsCheckbox;
  readonly winDemoPicker: WinDemoPicker;
  readonly winTypeOptions: SettingsCheckbox[];
  readonly paylineOptions: SettingsCheckbox[];

  private readonly backdrop = new Graphics();
  private readonly surface = new Container();
  private readonly card = new ScrollModalBackground();
  private readonly sectionLines = new Graphics();
  private readonly heading = new Text({
    text: 'SETTINGS',
    style: {
      fontFamily: 'Manrope Variable, sans-serif',
      fontSize: 24,
      fill: SCROLL_MODAL_COLORS.heading,
    },
  });
  private readonly subtitle = new Text({
    text: 'Choose how the game plays',
    style: {
      fontFamily: 'Manrope Variable, sans-serif',
      fontSize: 12,
      fill: SCROLL_MODAL_COLORS.ink,
    },
  });
  private readonly spinHeading = new Text({
    text: 'SPIN SETTINGS',
    style: {
      fontFamily: 'Manrope Variable, sans-serif',
      fontSize: 15,
      fill: SCROLL_MODAL_COLORS.heading,
    },
  });
  private readonly demoHeading = new Text({
    text: 'DEMO SETTINGS',
    style: {
      fontFamily: 'Manrope Variable, sans-serif',
      fontSize: 15,
      fill: SCROLL_MODAL_COLORS.heading,
    },
  });
  private readonly description = new Text({
    text: 'Turbo stops the reels faster after the server responds.',
    style: {
      fontFamily: 'Manrope Variable, sans-serif',
      fontSize: 13,
      fill: SCROLL_MODAL_COLORS.ink,
      wordWrap: true,
      wordWrapWidth: MODAL_WIDTH - CONTENT_PADDING_X * 2 - 28,
    },
  });
  private readonly anticipationDescription = new Text({
    text: 'Creates two visible Scarabs before a later reel. Changes demo odds.',
    style: {
      fontFamily: 'Manrope Variable, sans-serif',
      fontSize: 13,
      fill: SCROLL_MODAL_COLORS.ink,
      wordWrap: true,
      wordWrapWidth: MODAL_WIDTH - CONTENT_PADDING_X * 2 - 28,
    },
  });
  private readonly modeHeading = new Text({
    text: 'REEL MODE',
    style: {
      fontFamily: 'Manrope Variable, sans-serif',
      fontSize: 15,
      fill: SCROLL_MODAL_COLORS.heading,
    },
  });
  private readonly paylineHeading = new Text({
    text: 'WINNING LINES',
    style: {
      fontFamily: 'Manrope Variable, sans-serif',
      fontSize: 15,
      fill: SCROLL_MODAL_COLORS.heading,
    },
  });
  private readonly cascadeDescription = new Text({
    text: 'Winning symbols disappear and new symbols fall in. Changes payout math.',
    style: {
      fontFamily: 'Manrope Variable, sans-serif',
      fontSize: 13,
      fill: SCROLL_MODAL_COLORS.ink,
      wordWrap: true,
      wordWrapWidth: MODAL_WIDTH - CONTENT_PADDING_X * 2 - 28,
    },
  });
  private readonly hybridDescription = new Text({
    text: 'Reels spin normally; winning symbols then disappear and refill from above.',
    style: {
      fontFamily: 'Manrope Variable, sans-serif',
      fontSize: 13,
      fill: SCROLL_MODAL_COLORS.ink,
      wordWrap: true,
      wordWrapWidth: MODAL_WIDTH - CONTENT_PADDING_X * 2 - 28,
    },
  });
  private readonly winTypeHeading = new Text({
    text: 'WIN CATEGORY DEMO',
    style: {
      fontFamily: 'Manrope Variable, sans-serif',
      fontSize: 15,
      fill: SCROLL_MODAL_COLORS.heading,
    },
  });
  private readonly winTypeDescription = new Text({
    text: 'The server calculates a spin in the selected win category.',
    style: {
      fontFamily: 'Manrope Variable, sans-serif',
      fontSize: 13,
      fill: SCROLL_MODAL_COLORS.ink,
      wordWrap: true,
      wordWrapWidth: MODAL_WIDTH - CONTENT_PADDING_X * 2,
    },
  });
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
    this.sectionLines.eventMode = 'none';
    this.heading.anchor.set(0, 0.5);
    this.subtitle.anchor.set(0, 0.5);
    this.spinHeading.anchor.set(0, 0.5);
    this.demoHeading.anchor.set(0, 0.5);
    this.modeHeading.anchor.set(0, 0.5);
    this.paylineHeading.anchor.set(0, 0.5);
    this.winTypeHeading.anchor.set(0, 0.5);
    this.turboCheckbox = new SettingsCheckbox('TURBO SPIN', () => {
      if (store.canToggleSpinSettings) store.spinSettings.toggleTurbo();
    });
    this.anticipationCheckbox = new SettingsCheckbox('ANTICIPATION DEMO', () => {
      if (store.canToggleSpinSettings) store.spinSettings.toggleAnticipationDemo();
    });
    this.paylineOptions = PAYLINE_COUNTS.map((count) => {
      const option = new SettingsCheckbox(`${count} LINES`, () => {
        if (store.canToggleSpinSettings && (store.gameConfig?.paylines.length ?? 0) >= count) {
          store.spinSettings.setPaylineCount(count);
        }
      });
      return option;
    });
    this.classicCheckbox = new SettingsCheckbox('CLASSIC SPIN', () => {
      if (store.canToggleSpinSettings) store.spinSettings.selectClassic();
    });
    this.cascadeCheckbox = new SettingsCheckbox('CASCADE', () => {
      if (store.canToggleSpinSettings) store.spinSettings.toggleCascade();
    });
    this.hybridCheckbox = new SettingsCheckbox('HYBRID SPIN', () => {
      if (store.canToggleSpinSettings) store.spinSettings.toggleHybrid();
    });
    this.winDemoCheckbox = new SettingsCheckbox('WIN COMBINATION DEMO', () => {
      if (store.canToggleSpinSettings) store.spinSettings.toggleWinDemo();
    });
    this.winDemoPicker = new WinDemoPicker({
      previousSymbol: () => store.spinSettings.cycleWinDemoSymbol(-1),
      nextSymbol: () => store.spinSettings.cycleWinDemoSymbol(1),
      previousCount: () => store.spinSettings.cycleWinDemoCount(-1),
      nextCount: () => store.spinSettings.cycleWinDemoCount(1),
    });
    this.winTypeOptions = WIN_DEMO_TYPES.map((winType) => {
      const option = new SettingsCheckbox(winType.replaceAll('_', ' '), () => {
        if (store.canToggleSpinSettings) store.spinSettings.selectWinTypeDemo(winType);
      });
      return option;
    });

    this.surface.addChild(
      this.card,
      this.sectionLines,
      this.heading,
      this.subtitle,
      this.spinHeading,
      this.demoHeading,
      this.description,
      this.turboCheckbox,
      this.anticipationDescription,
      this.anticipationCheckbox,
      this.paylineHeading,
      ...this.paylineOptions,
      this.modeHeading,
      this.classicCheckbox,
      this.cascadeDescription,
      this.cascadeCheckbox,
      this.hybridDescription,
      this.hybridCheckbox,
      this.winDemoCheckbox,
      this.winDemoPicker,
      this.winTypeHeading,
      this.winTypeDescription,
      ...this.winTypeOptions,
      this.closeButton,
    );
    this.addChild(this.backdrop, this.surface);
    this.layoutContent(true);
    this.stopObserving = autorun(() => {
      this.turboCheckbox.setState(store.spinSettings.turboEnabled, store.canToggleSpinSettings);
      this.anticipationCheckbox.setState(
        store.spinSettings.anticipationDemoEnabled,
        store.canToggleSpinSettings && !store.spinSettings.cascadeEnabled,
      );
      this.paylineOptions.forEach((option, index) =>
        option.setState(
          store.spinSettings.paylineCount === PAYLINE_COUNTS[index],
          store.canToggleSpinSettings &&
            (store.gameConfig?.paylines.length ?? 0) >= PAYLINE_COUNTS[index],
        ),
      );
      this.classicCheckbox.setState(store.spinSettings.classicEnabled, store.canToggleSpinSettings);
      this.cascadeCheckbox.setState(store.spinSettings.cascadeEnabled, store.canToggleSpinSettings);
      this.hybridCheckbox.setState(store.spinSettings.hybridEnabled, store.canToggleSpinSettings);
      this.winDemoCheckbox.setState(store.spinSettings.winDemoEnabled, store.canToggleSpinSettings);
      this.winDemoPicker.setState(
        store.spinSettings.winDemoSymbol,
        store.spinSettings.winDemoCount,
        store.spinSettings.winDemoEnabled && store.canToggleSpinSettings,
      );
      this.winTypeOptions.forEach((option, index) =>
        option.setState(
          store.spinSettings.winTypeDemo === WIN_DEMO_TYPES[index],
          store.canToggleSpinSettings,
        ),
      );
    });
  }

  private layoutContent(wide: boolean): void {
    this.wide = wide;
    const width = wide ? MODAL_WIDTH : NARROW_MODAL_WIDTH;
    const height = wide ? MODAL_HEIGHT : NARROW_MODAL_HEIGHT;
    const contentWidth = width - CONTENT_PADDING_X * 2;
    const columnGap = 28;
    const columnWidth = (contentWidth - columnGap) / 2;
    const rightX = CONTENT_PADDING_X + columnWidth + columnGap;
    const sectionWidth = wide ? columnWidth : contentWidth;
    const descriptionWidth = sectionWidth - 28;
    const divider = (x1: number, y1: number, x2: number, y2: number): void => {
      this.sectionLines
        .moveTo(x1, y1)
        .lineTo(x2, y2)
        .stroke({ color: SCROLL_MODAL_COLORS.buttonBorder, width: 1, alpha: 0.55 });
    };

    this.card.resize(width, height);
    this.surface.pivot.set(width / 2, height / 2);
    this.heading.position.set(CONTENT_PADDING_X, CONTENT_PADDING_TOP);
    this.subtitle.position.set(CONTENT_PADDING_X, CONTENT_PADDING_TOP + 28);
    this.closeButton.position.set(width - CONTENT_PADDING_X, CONTENT_PADDING_TOP);
    for (const text of [
      this.description,
      this.anticipationDescription,
      this.cascadeDescription,
      this.hybridDescription,
    ]) {
      text.style.wordWrapWidth = descriptionWidth;
    }
    this.winTypeDescription.style.wordWrapWidth = sectionWidth;
    this.turboCheckbox.resize(sectionWidth);
    this.anticipationCheckbox.resize(sectionWidth);
    this.classicCheckbox.resize(sectionWidth);
    this.cascadeCheckbox.resize(sectionWidth);
    this.hybridCheckbox.resize(sectionWidth);
    this.winDemoCheckbox.resize(sectionWidth);
    this.winDemoPicker.resize(sectionWidth);

    this.sectionLines.clear();
    divider(CONTENT_PADDING_X, 120, width - CONTENT_PADDING_X, 120);
    if (wide) {
      divider(
        CONTENT_PADDING_X + columnWidth + columnGap / 2,
        141,
        CONTENT_PADDING_X + columnWidth + columnGap / 2,
        665,
      );
      divider(CONTENT_PADDING_X, 257, CONTENT_PADDING_X + columnWidth, 257);
      divider(CONTENT_PADDING_X, 356, CONTENT_PADDING_X + columnWidth, 356);
      divider(rightX, 260, rightX + columnWidth, 260);
      divider(rightX, 410, rightX + columnWidth, 410);

      this.spinHeading.position.set(CONTENT_PADDING_X, 149);
      this.turboCheckbox.position.set(CONTENT_PADDING_X, 188);
      this.description.position.set(CONTENT_PADDING_X + 28, 209);
      this.paylineHeading.position.set(CONTENT_PADDING_X, 281);
      this.paylineOptions.forEach((option, index) => {
        const optionWidth = columnWidth / PAYLINE_COUNTS.length;
        option.position.set(CONTENT_PADDING_X + index * optionWidth, 322);
        option.resize(optionWidth);
      });
      this.modeHeading.position.set(CONTENT_PADDING_X, 382);
      this.classicCheckbox.position.set(CONTENT_PADDING_X, 420);
      this.cascadeCheckbox.position.set(CONTENT_PADDING_X, 463);
      this.cascadeDescription.position.set(CONTENT_PADDING_X + 28, 486);
      this.hybridCheckbox.position.set(CONTENT_PADDING_X, 555);
      this.hybridDescription.position.set(CONTENT_PADDING_X + 28, 578);

      this.demoHeading.position.set(rightX, 149);
      this.anticipationCheckbox.position.set(rightX, 188);
      this.anticipationDescription.position.set(rightX + 28, 209);
      this.winDemoCheckbox.position.set(rightX, 294);
      this.winDemoPicker.position.set(rightX, 327);
      this.winTypeHeading.position.set(rightX, 438);
      this.winTypeDescription.position.set(rightX, 464);
      this.winTypeOptions.forEach((option, index) => {
        option.position.set(rightX, 530 + index * 38);
        option.resize(columnWidth);
      });
    } else {
      for (const y of [243, 338, 595, 711, 831]) {
        divider(CONTENT_PADDING_X, y, width - CONTENT_PADDING_X, y);
      }
      this.spinHeading.position.set(CONTENT_PADDING_X, 141);
      this.turboCheckbox.position.set(CONTENT_PADDING_X, 178);
      this.description.position.set(CONTENT_PADDING_X + 28, 200);
      this.paylineHeading.position.set(CONTENT_PADDING_X, 267);
      this.paylineOptions.forEach((option, index) => {
        const optionWidth = contentWidth / PAYLINE_COUNTS.length;
        option.position.set(CONTENT_PADDING_X + index * optionWidth, 305);
        option.resize(optionWidth);
      });
      this.modeHeading.position.set(CONTENT_PADDING_X, 365);
      this.classicCheckbox.position.set(CONTENT_PADDING_X, 401);
      this.cascadeCheckbox.position.set(CONTENT_PADDING_X, 443);
      this.cascadeDescription.position.set(CONTENT_PADDING_X + 28, 465);
      this.hybridCheckbox.position.set(CONTENT_PADDING_X, 531);
      this.hybridDescription.position.set(CONTENT_PADDING_X + 28, 553);

      this.demoHeading.position.set(CONTENT_PADDING_X, 620);
      this.anticipationCheckbox.position.set(CONTENT_PADDING_X, 651);
      this.anticipationDescription.position.set(CONTENT_PADDING_X + 28, 672);
      this.winDemoCheckbox.position.set(CONTENT_PADDING_X, 737);
      this.winDemoPicker.position.set(CONTENT_PADDING_X, 763);
      this.winTypeHeading.position.set(CONTENT_PADDING_X, 855);
      this.winTypeDescription.position.set(CONTENT_PADDING_X, 879);
      this.winTypeOptions.forEach((option, index) => {
        const optionWidth = contentWidth / 2;
        option.position.set(
          CONTENT_PADDING_X + (index % 2) * optionWidth,
          936 + Math.floor(index / 2) * 36,
        );
        option.resize(optionWidth);
      });
    }
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
    const modalWidth = wide ? MODAL_WIDTH : NARROW_MODAL_WIDTH;
    const modalHeight = wide ? MODAL_HEIGHT : NARROW_MODAL_HEIGHT;
    this.backdrop.clear().rect(0, 0, width, height).fill({ color: 0x09030f, alpha: 0.72 });
    this.backdrop.hitArea = new Rectangle(0, 0, width, height);
    this.surface.position.set(width / 2, height / 2);
    this.targetScale = Math.min(
      1,
      (width - MODAL_MARGIN * 2) / modalWidth,
      (height - MODAL_MARGIN * 2) / modalHeight,
    );
    if (!this.animation) this.surface.scale.set(this.targetScale);
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.animation?.kill();
    window.removeEventListener('keydown', this.onKeyDown);
    this.stopObserving();
    super.destroy(options);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.close();
  };
}
