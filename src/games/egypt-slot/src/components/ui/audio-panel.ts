import 'pixi.js/text-bitmap';
import { BitmapText, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { autorun, type IReactionDisposer } from 'mobx';
import type { AudioController } from '../../controllers/audio-controller/AudioController';

const PANEL_WIDTH = 202;
const PANEL_HEIGHT = 64;
const SLIDER_WIDTH = 106;
const GOLD = 0xffdfa0;
const MUTED_GOLD = 0x9b8465;

export class AudioPanel extends Container {
  private readonly icon = new Graphics();
  private readonly track = new Graphics();
  private readonly amount: BitmapText;
  private readonly slider = new Container();
  private readonly stopObserving: IReactionDisposer;
  private dragging = false;

  constructor(audio: AudioController) {
    super();
    this.label = 'audio-panel';

    const background = new Graphics()
      .roundRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 13)
      .fill({ color: 0x261a26, alpha: 0.91 })
      .stroke({ color: 0xc5a06b, alpha: 0.75, width: 1.5 });
    const muteButton = new Container();
    muteButton.label = 'audio-mute-button';
    muteButton.position.set(14, PANEL_HEIGHT / 2);
    muteButton.eventMode = 'static';
    muteButton.cursor = 'pointer';
    muteButton.hitArea = new Rectangle(-8, -22, 49, 44);
    muteButton.addChild(this.icon);
    muteButton.on('pointerover', () => audio.playHover());
    muteButton.on('pointertap', (event: FederatedPointerEvent) => {
      event.stopPropagation();
      audio.setMuted(!audio.store.muted);
      audio.playClick();
    });

    const title = new BitmapText({
      text: 'SOUND',
      style: { fontFamily: 'CasinoGoldBold', fontSize: 13, fill: GOLD },
    });
    title.position.set(75, 9);

    this.amount = new BitmapText({
      text: '35%',
      style: { fontFamily: 'CasinoGoldBold', fontSize: 12, fill: GOLD },
    });
    this.amount.anchor.set(1, 0);
    this.amount.position.set(184, 10);

    this.slider.label = 'audio-volume-slider';
    this.slider.position.set(77, 43);
    this.slider.eventMode = 'static';
    this.slider.cursor = 'pointer';
    this.slider.hitArea = new Rectangle(-8, -14, SLIDER_WIDTH + 16, 28);
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

    this.addChild(background, muteButton, title, this.amount, this.slider);
    this.stopObserving = autorun(() => this.draw(audio.store.muted, audio.store.volume));
  }

  resize(width: number, height: number): void {
    const scale = width < 480 ? 0.8 : 1;
    const margin = Math.max(12, Math.min(24, Math.min(width, height) * 0.025));
    this.scale.set(scale);
    this.position.set(width - PANEL_WIDTH * scale - margin, margin);
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.stopObserving();
    super.destroy(options);
  }

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
    const color = muted ? MUTED_GOLD : GOLD;
    this.icon
      .clear()
      .moveTo(0, -5)
      .lineTo(7, -5)
      .lineTo(15, -12)
      .lineTo(15, 12)
      .lineTo(7, 5)
      .lineTo(0, 5)
      .closePath()
      .fill(color);
    if (muted) {
      this.icon
        .moveTo(20, -7)
        .lineTo(31, 7)
        .moveTo(31, -7)
        .lineTo(20, 7)
        .stroke({ color: GOLD, width: 2.5 });
    } else {
      this.icon
        .moveTo(20, -8)
        .lineTo(25, -3)
        .lineTo(25, 3)
        .lineTo(20, 8)
        .stroke({ color: GOLD, width: 2.5 });
    }

    const filled = SLIDER_WIDTH * volume;
    this.track.clear().roundRect(0, -3, SLIDER_WIDTH, 6, 3).fill(0x4a3440);
    if (filled > 0) {
      this.track.roundRect(0, -3, filled, 6, 3).fill(color);
    }
    this.track.circle(filled, 0, 7).fill(0x3c2430).stroke({ color, width: 2 });
    this.amount.text = `${Math.round(volume * 100)}%`;
    this.amount.alpha = muted ? 0.7 : 1;
  }
}
