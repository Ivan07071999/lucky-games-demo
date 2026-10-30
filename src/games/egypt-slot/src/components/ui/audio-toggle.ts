import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { autorun, type IReactionDisposer } from 'mobx';
import { gsap } from 'gsap';
import { EgyptImageAssetKey } from '../../assets';
import type { AudioController } from '../../controllers/audio-controller/AudioController';
import { DEFAULT_AUDIO_VOLUME } from '../../stores/AudioStore';

const ICON_SIZE = 28;
const HIT_SIZE = 44;

export class AudioToggle extends Container {
  private readonly icon = new Sprite(Texture.from(EgyptImageAssetKey.buttons.soundOff));
  private readonly highlight = new Graphics()
    .circle(0, 0, 16)
    .fill({ color: 0xffd58c, alpha: 0.18 });
  private readonly stopObserving: IReactionDisposer;
  private readonly onTexture = Texture.from(EgyptImageAssetKey.buttons.soundOn);
  private readonly offTexture = Texture.from(EgyptImageAssetKey.buttons.soundOff);

  constructor(audio: AudioController) {
    super();
    this.label = 'audio-toggle-button';
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Rectangle(-HIT_SIZE / 2, -HIT_SIZE / 2, HIT_SIZE, HIT_SIZE);

    this.highlight.alpha = 0;
    this.highlight.eventMode = 'none';
    this.icon.anchor.set(0.5);
    this.icon.width = ICON_SIZE;
    this.icon.height = ICON_SIZE;
    this.icon.eventMode = 'none';
    this.addChild(this.highlight, this.icon);

    this.on('pointertap', (event) => {
      event.stopPropagation();
      if (audio.store.muted && audio.store.volume === 0) audio.setVolume(DEFAULT_AUDIO_VOLUME);
      audio.setMuted(!audio.store.muted);
    });
    this.on('pointerover', () => {
      gsap.to(this.highlight, { alpha: 1, duration: 0.2, overwrite: true });
    });
    this.on('pointerout', () => {
      gsap.to(this.highlight, { alpha: 0, duration: 0.2, overwrite: true });
    });

    this.stopObserving = autorun(() => {
      this.icon.texture = audio.store.muted ? this.offTexture : this.onTexture;
    });
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    gsap.killTweensOf(this.highlight);
    this.stopObserving();
    super.destroy(options);
  }
}
