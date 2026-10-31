import { Container, Texture } from 'pixi.js';
import { autorun, type IReactionDisposer } from 'mobx';
import { EgyptImageAssetKey } from '../../../assets';
import type { AudioController } from '../../../controllers/audio-controller/AudioController';
import { DEFAULT_AUDIO_VOLUME } from '../../../stores/AudioStore';
import { IconButton } from './icon-button';

export class AudioToggle extends IconButton {
  private readonly stopObserving: IReactionDisposer;
  private readonly onTexture = Texture.from(EgyptImageAssetKey.buttons.soundOn);
  private readonly offTexture = Texture.from(EgyptImageAssetKey.buttons.soundOff);

  constructor(audio: AudioController) {
    super('audio-toggle-button', EgyptImageAssetKey.buttons.soundOff, () => {
      if (audio.store.muted && audio.store.volume === 0) audio.setVolume(DEFAULT_AUDIO_VOLUME);
      audio.setMuted(!audio.store.muted);
    });
    this.stopObserving = autorun(() => {
      this.setIconTexture(audio.store.muted ? this.offTexture : this.onTexture);
    });
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.stopObserving();
    super.destroy(options);
  }
}
