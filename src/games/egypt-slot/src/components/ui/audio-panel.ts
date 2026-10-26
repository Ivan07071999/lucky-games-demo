import 'pixi.js/text-bitmap';
import {
  BitmapText,
  Container,
  Graphics,
  Point,
  Rectangle,
  Sprite,
  Texture,
  type FederatedPointerEvent,
} from 'pixi.js';
import { autorun, type IReactionDisposer } from 'mobx';
import { gsap } from 'gsap';
import { EgyptImageAssetKey } from '../../assets';
import type { AudioController } from '../../controllers/audio-controller/AudioController';
import { ScrollModalBackground } from './scroll-modal-background';
import { SCROLL_MODAL_COLORS } from './scroll-modal-theme';

const ICON_WIDTH = 56;
const ICON_HEIGHT = 56;
const POPUP_WIDTH = 260;
const POPUP_HEIGHT = 118;
const POPUP_GAP = 6;
const SLIDER_WIDTH = 75;
const SLIDER_X = 106;
const SLIDER_Y = 62;

export class AudioPanel extends Container {
  private readonly launcher: Sprite;
  private readonly popup = new Container();
  private readonly toggle: Sprite;
  private readonly track = new Graphics();
  private readonly amount: BitmapText;
  private readonly slider = new Container();
  private readonly stopObserving: IReactionDisposer;
  private readonly onTexture = Texture.from(EgyptImageAssetKey.buttons.soundOn);
  private readonly offTexture = Texture.from(EgyptImageAssetKey.buttons.soundOff);
  private viewportWidth = 0;
  private viewportHeight = 0;
  private dragging = false;
  private popupOpen = false;
  private popupTween: gsap.core.Timeline | null = null;

  constructor(audio: AudioController) {
    super();
    this.label = 'audio-panel';

    this.launcher = this.createIcon(ICON_WIDTH, ICON_HEIGHT);
    this.launcher.label = 'audio-popup-button';
    this.launcher.on('pointerover', () => audio.playHover());
    this.launcher.on('pointertap', (event: FederatedPointerEvent) => {
      event.stopPropagation();
      this.setPopupOpen(!this.popupOpen);
      if (this.popupOpen) audio.playMenuOpen();
    });

    this.popup.label = 'audio-popup';
    this.popup.pivot.set(POPUP_WIDTH, 0);
    this.popup.position.set(ICON_WIDTH, ICON_HEIGHT + POPUP_GAP);
    this.popup.visible = false;
    this.popup.alpha = 0;
    this.popup.scale.set(0.96);
    this.popup.eventMode = 'none';
    const background = new ScrollModalBackground();
    background.resize(POPUP_WIDTH, POPUP_HEIGHT);
    background.on('pointertap', (event: FederatedPointerEvent) => event.stopPropagation());

    this.toggle = this.createIcon(44, 44);
    this.toggle.label = 'audio-mute-button';
    this.toggle.position.set(36, 37);
    this.toggle.on('pointerover', () => audio.playHover());
    this.toggle.on('pointertap', (event: FederatedPointerEvent) => {
      event.stopPropagation();
      audio.setMuted(!audio.store.muted);
      audio.playClick();
    });

    this.amount = new BitmapText({
      text: '35%',
      style: { fontFamily: 'CasinoGoldBold', fontSize: 13, fill: SCROLL_MODAL_COLORS.ink },
    });
    this.amount.anchor.set(0.5);
    this.amount.position.set(208, SLIDER_Y + 2);

    this.slider.label = 'audio-volume-slider';
    this.slider.position.set(SLIDER_X, SLIDER_Y);
    this.slider.eventMode = 'static';
    this.slider.cursor = 'pointer';
    this.slider.hitArea = new Rectangle(-8, -16, SLIDER_WIDTH + 16, 32);
    this.slider.addChild(this.track);
    this.slider.on('pointerover', () => audio.playHover());
    this.slider.on('pointerdown', (event: FederatedPointerEvent) => {
      event.stopPropagation();
      this.dragging = true;
      this.updateVolume(event, audio);
    });
    this.slider.on('globalpointermove', (event: FederatedPointerEvent) => {
      if (this.dragging) this.updateVolume(event, audio);
    });
    this.slider.on('pointerup', this.stopDragging);
    this.slider.on('pointerupoutside', this.stopDragging);

    this.popup.addChild(background, this.toggle, this.slider, this.amount);
    this.addChild(this.popup, this.launcher);
    this.stopObserving = autorun(() => this.draw(audio.store.muted, audio.store.volume));
  }

  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    const margin = Math.max(12, Math.min(24, Math.min(width, height) * 0.025));
    const scale = Math.min(
      width < 480 ? 0.86 : 1,
      (width - margin * 2) / POPUP_WIDTH,
      (height - margin * 2) / (ICON_HEIGHT + POPUP_GAP + POPUP_HEIGHT),
    );
    this.scale.set(Math.max(0.5, scale));
    this.position.set(width - ICON_WIDTH * this.scale.x - margin, margin);
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.popupTween?.kill();
    window.removeEventListener('pointerdown', this.dismissOnOutsidePointerDown, true);
    window.removeEventListener('keydown', this.dismissOnEscape);
    this.stopObserving();
    super.destroy(options);
  }

  private createIcon(width: number, height: number): Sprite {
    const icon = new Sprite(this.offTexture);
    icon.width = width;
    icon.height = height;
    icon.eventMode = 'static';
    icon.cursor = 'pointer';
    icon.hitArea = new Rectangle(0, 0, icon.texture.width, icon.texture.height);
    return icon;
  }

  private setPopupOpen(open: boolean): void {
    if (this.popupOpen === open) return;
    this.popupOpen = open;
    this.popupTween?.kill();
    if (open) {
      this.popup.visible = true;
      this.popup.eventMode = 'auto';
      window.addEventListener('pointerdown', this.dismissOnOutsidePointerDown, true);
      window.addEventListener('keydown', this.dismissOnEscape);
      this.popupTween = gsap
        .timeline({
          onComplete: () => {
            this.popupTween = null;
          },
        })
        .to(this.popup, { alpha: 1, duration: 0.25, ease: 'power2.out' }, 0)
        .to(this.popup.scale, { x: 1, y: 1, duration: 0.25, ease: 'power2.out' }, 0);
    } else {
      this.dragging = false;
      this.popup.eventMode = 'none';
      window.removeEventListener('pointerdown', this.dismissOnOutsidePointerDown, true);
      window.removeEventListener('keydown', this.dismissOnEscape);
      this.popupTween = gsap
        .timeline({
          onComplete: () => {
            if (!this.popupOpen) this.popup.visible = false;
            this.popupTween = null;
          },
        })
        .to(this.popup, { alpha: 0, duration: 0.2, ease: 'power2.inOut' }, 0)
        .to(this.popup.scale, { x: 0.96, y: 0.96, duration: 0.2, ease: 'power2.inOut' }, 0);
    }
  }

  private readonly dismissOnEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.setPopupOpen(false);
  };

  private readonly dismissOnOutsidePointerDown = (event: PointerEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLCanvasElement)) {
      this.setPopupOpen(false);
      return;
    }
    const bounds = target.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const point = new Point(
      ((event.clientX - bounds.left) * this.viewportWidth) / bounds.width,
      ((event.clientY - bounds.top) * this.viewportHeight) / bounds.height,
    );
    const panelBounds = this.getBounds();
    if (
      point.x < panelBounds.minX ||
      point.x > panelBounds.maxX ||
      point.y < panelBounds.minY ||
      point.y > panelBounds.maxY
    ) {
      this.setPopupOpen(false);
    }
  };

  private readonly stopDragging = (): void => {
    this.dragging = false;
  };

  private updateVolume(event: FederatedPointerEvent, audio: AudioController): void {
    const x = this.slider.toLocal(event.global).x;
    const volume = Math.max(0, Math.min(1, x / SLIDER_WIDTH));
    audio.setVolume(volume);
    if (volume === 0 && !audio.store.muted) audio.setMuted(true);
    if (volume > 0 && audio.store.muted) audio.setMuted(false);
  }

  private draw(muted: boolean, volume: number): void {
    const texture = muted ? this.offTexture : this.onTexture;
    this.launcher.texture = texture;
    this.toggle.texture = texture;

    const color = muted ? 0x937654 : SCROLL_MODAL_COLORS.heading;
    const filled = SLIDER_WIDTH * volume;
    this.track.clear().roundRect(0, -3, SLIDER_WIDTH, 6, 3).fill(0xa67b51);
    if (filled > 0) this.track.roundRect(0, -3, filled, 6, 3).fill(color);
    this.track.circle(filled, 0, 7).fill(0xf5d39a).stroke({ color, width: 2 });
    this.amount.text = `${Math.round(volume * 100)}%`;
    this.amount.alpha = muted ? 0.7 : 1;
  }
}
