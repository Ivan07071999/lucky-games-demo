import { gsap } from 'gsap';
import { autorun, type IReactionDisposer } from 'mobx';
import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import type { SlotStore } from '../../stores/SlotStore';
import { ScrollModalBackground } from './scroll-modal-background';
import { ScrollModalCloseButton } from './scroll-modal-close-button';
import { SCROLL_MODAL_COLORS } from './scroll-modal-theme';
import { SettingsCheckbox } from './settings-checkbox';
import { WinDemoPicker } from './win-demo-picker';

const MODAL_WIDTH = 460;
const MODAL_HEIGHT = 690;
const MODAL_MARGIN = 16;
const CONTENT_PADDING_X = 56;
const CONTENT_PADDING_TOP = 64;

export class GameSettingsModal extends Container {
  readonly turboCheckbox: SettingsCheckbox;
  readonly anticipationCheckbox: SettingsCheckbox;
  readonly classicCheckbox: SettingsCheckbox;
  readonly cascadeCheckbox: SettingsCheckbox;
  readonly hybridCheckbox: SettingsCheckbox;
  readonly winDemoCheckbox: SettingsCheckbox;
  readonly winDemoPicker: WinDemoPicker;

  private readonly backdrop = new Graphics();
  private readonly surface = new Container();
  private readonly card = new ScrollModalBackground();
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
  private readonly closeButton = new ScrollModalCloseButton(() => this.close());
  private readonly stopObserving: IReactionDisposer;
  private animation: gsap.core.Timeline | null = null;
  private targetScale = 1;
  private opened = false;

  constructor(store: SlotStore) {
    super();
    this.label = 'game-settings-modal';
    this.visible = false;
    this.eventMode = 'none';

    this.backdrop.eventMode = 'static';
    this.backdrop.on('pointertap', () => this.close());
    this.card.resize(MODAL_WIDTH, MODAL_HEIGHT);
    this.heading.anchor.set(0, 0.5);
    this.heading.position.set(CONTENT_PADDING_X, CONTENT_PADDING_TOP);
    this.subtitle.anchor.set(0, 0.5);
    this.subtitle.position.set(CONTENT_PADDING_X, CONTENT_PADDING_TOP + 27);
    this.spinHeading.anchor.set(0, 0.5);
    this.spinHeading.position.set(CONTENT_PADDING_X, CONTENT_PADDING_TOP + 70);
    this.description.position.set(CONTENT_PADDING_X + 28, CONTENT_PADDING_TOP + 130);
    this.anticipationDescription.position.set(CONTENT_PADDING_X + 28, CONTENT_PADDING_TOP + 205);
    this.modeHeading.anchor.set(0, 0.5);
    this.modeHeading.position.set(CONTENT_PADDING_X, CONTENT_PADDING_TOP + 264);
    this.cascadeDescription.position.set(CONTENT_PADDING_X + 28, CONTENT_PADDING_TOP + 361);
    this.hybridDescription.position.set(CONTENT_PADDING_X + 28, CONTENT_PADDING_TOP + 446);
    this.closeButton.position.set(MODAL_WIDTH - CONTENT_PADDING_X, CONTENT_PADDING_TOP);
    this.turboCheckbox = new SettingsCheckbox('TURBO SPIN', () => {
      if (store.canToggleSpinSettings) store.spinSettings.toggleTurbo();
    });
    this.turboCheckbox.position.set(CONTENT_PADDING_X, CONTENT_PADDING_TOP + 110);
    this.turboCheckbox.resize(MODAL_WIDTH - CONTENT_PADDING_X * 2);
    this.anticipationCheckbox = new SettingsCheckbox('ANTICIPATION DEMO', () => {
      if (store.canToggleSpinSettings) store.spinSettings.toggleAnticipationDemo();
    });
    this.anticipationCheckbox.position.set(CONTENT_PADDING_X, CONTENT_PADDING_TOP + 184);
    this.anticipationCheckbox.resize(MODAL_WIDTH - CONTENT_PADDING_X * 2);
    this.classicCheckbox = new SettingsCheckbox('CLASSIC SPIN', () => {
      if (store.canToggleSpinSettings) store.spinSettings.selectClassic();
    });
    this.classicCheckbox.position.set(CONTENT_PADDING_X, CONTENT_PADDING_TOP + 294);
    this.classicCheckbox.resize(MODAL_WIDTH - CONTENT_PADDING_X * 2);
    this.cascadeCheckbox = new SettingsCheckbox('CASCADE', () => {
      if (store.canToggleSpinSettings) store.spinSettings.toggleCascade();
    });
    this.cascadeCheckbox.position.set(CONTENT_PADDING_X, CONTENT_PADDING_TOP + 340);
    this.cascadeCheckbox.resize(MODAL_WIDTH - CONTENT_PADDING_X * 2);
    this.hybridCheckbox = new SettingsCheckbox('HYBRID SPIN', () => {
      if (store.canToggleSpinSettings) store.spinSettings.toggleHybrid();
    });
    this.hybridCheckbox.position.set(CONTENT_PADDING_X, CONTENT_PADDING_TOP + 425);
    this.hybridCheckbox.resize(MODAL_WIDTH - CONTENT_PADDING_X * 2);
    this.winDemoCheckbox = new SettingsCheckbox('WIN COMBINATION DEMO', () => {
      if (store.canToggleSpinSettings) store.spinSettings.toggleWinDemo();
    });
    this.winDemoCheckbox.position.set(CONTENT_PADDING_X, CONTENT_PADDING_TOP + 520);
    this.winDemoCheckbox.resize(MODAL_WIDTH - CONTENT_PADDING_X * 2);
    this.winDemoPicker = new WinDemoPicker({
      previousSymbol: () => store.spinSettings.cycleWinDemoSymbol(-1),
      nextSymbol: () => store.spinSettings.cycleWinDemoSymbol(1),
      previousCount: () => store.spinSettings.cycleWinDemoCount(-1),
      nextCount: () => store.spinSettings.cycleWinDemoCount(1),
    });
    this.winDemoPicker.position.set(CONTENT_PADDING_X, CONTENT_PADDING_TOP + 545);

    this.surface.pivot.set(MODAL_WIDTH / 2, MODAL_HEIGHT / 2);
    this.surface.addChild(
      this.card,
      this.heading,
      this.subtitle,
      this.spinHeading,
      this.description,
      this.turboCheckbox,
      this.anticipationDescription,
      this.anticipationCheckbox,
      this.modeHeading,
      this.classicCheckbox,
      this.cascadeDescription,
      this.cascadeCheckbox,
      this.hybridDescription,
      this.hybridCheckbox,
      this.winDemoCheckbox,
      this.winDemoPicker,
      this.closeButton,
    );
    this.addChild(this.backdrop, this.surface);
    this.stopObserving = autorun(() => {
      this.turboCheckbox.setState(store.spinSettings.turboEnabled, store.canToggleSpinSettings);
      this.anticipationCheckbox.setState(
        store.spinSettings.anticipationDemoEnabled,
        store.canToggleSpinSettings && !store.spinSettings.cascadeEnabled,
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
    this.backdrop.clear().rect(0, 0, width, height).fill({ color: 0x09030f, alpha: 0.72 });
    this.backdrop.hitArea = new Rectangle(0, 0, width, height);
    this.surface.position.set(width / 2, height / 2);
    this.targetScale = Math.min(
      1,
      (width - MODAL_MARGIN * 2) / MODAL_WIDTH,
      (height - MODAL_MARGIN * 2) / MODAL_HEIGHT,
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
