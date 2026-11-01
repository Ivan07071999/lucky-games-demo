import type { WinType } from '@lucky-games/contracts';
import { EgyptAudioAssetKey, type EgyptAudioAssetKeyType } from '../../assets';
import type { GameEvents } from '../../events';
import type { ReelsAnimationCue } from '../../events/GameEvents';
import type { GameEmitter } from '../../events/GameEmitter';
import type { AudioStore } from '../../stores/AudioStore';
import type { AssetsController } from '../assets-controller/AssetsController';
import {
  ANTICIPATION_GAIN,
  ANTICIPATION_MUSIC_DUCK,
  BASE_LOOPS,
  CASCADE_CUE_INTERVAL_MS,
  EFFECT_GAIN,
  WIN_SOUND,
} from './audioConfig';
import { AudioPlayer } from './AudioPlayer';

export class AudioController {
  readonly store: AudioStore;
  private readonly player: AudioPlayer;
  private readonly unsubscribe: (() => void)[];
  private lastHoverAt = 0;
  private lastCascadeFallAt = 0;
  private lastCascadeLandAt = 0;
  private anticipationActive = false;
  private disposed = false;

  constructor(assets: AssetsController, store: AudioStore, emitter: GameEmitter<GameEvents>) {
    this.store = store;
    this.player = new AudioPlayer(assets, store);
    for (const [key, gain] of Object.entries(BASE_LOOPS) as [EgyptAudioAssetKeyType, number][]) {
      this.player.setLoop(key, gain, true);
    }
    this.unsubscribe = [
      emitter.on('reel:stopped', () => this.playEffect(EgyptAudioAssetKey.reelStop)),
      emitter.on('reels:cue', (cue) => this.playReelsCue(cue)),
      emitter.on('ui:betChanged', () => this.playEffect(EgyptAudioAssetKey.uiBetChange)),
    ];
  }

  setMuted(muted: boolean): void {
    if (this.disposed) return;
    this.store.setMuted(muted);
    this.player.setMuted(muted);
  }

  setVolume(volume: number): void {
    if (this.disposed) return;
    this.store.setVolume(volume);
    this.player.setVolume();
  }

  playHover(): void {
    const now = Date.now();
    if (now - this.lastHoverAt < 100) return;
    this.lastHoverAt = now;
    this.playEffect(EgyptAudioAssetKey.uiHover);
  }

  playClick(): void {
    this.playEffect(EgyptAudioAssetKey.uiClick);
  }

  playFreeSpinsIntro(): void {
    this.playEffect(EgyptAudioAssetKey.freeSpinsIntro);
  }

  playFreeSpinsOutro(): void {
    this.playEffect(EgyptAudioAssetKey.freeSpinsOutro);
  }

  playWin(type: WinType): void {
    const key = WIN_SOUND[type];
    if (key) this.playEffect(key);
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribe.forEach((unsubscribe) => unsubscribe());
    this.player.destroy();
  }

  private playReelsCue(cue: ReelsAnimationCue): void {
    switch (cue) {
      case 'winLine':
        this.playEffect(EgyptAudioAssetKey.winLine);
        break;
      case 'anticipationStart':
        this.anticipationActive = true;
        this.updateMusicVolume();
        this.player.setLoop(EgyptAudioAssetKey.anticipationLoop, ANTICIPATION_GAIN, true);
        break;
      case 'anticipationEnd':
        this.anticipationActive = false;
        this.player.setLoop(EgyptAudioAssetKey.anticipationLoop, ANTICIPATION_GAIN, false);
        this.updateMusicVolume();
        break;
      case 'cascadeFall':
        this.playCascadeCue(EgyptAudioAssetKey.cascadeFall, 'fall');
        break;
      case 'cascadeLand':
        this.playCascadeCue(EgyptAudioAssetKey.cascadeLand, 'land');
        break;
    }
  }

  private playCascadeCue(key: EgyptAudioAssetKeyType, kind: 'fall' | 'land'): void {
    const now = Date.now();
    const lastAt = kind === 'fall' ? this.lastCascadeFallAt : this.lastCascadeLandAt;
    if (now - lastAt < CASCADE_CUE_INTERVAL_MS) return;
    if (kind === 'fall') this.lastCascadeFallAt = now;
    else this.lastCascadeLandAt = now;
    this.playEffect(key);
  }

  private updateMusicVolume(): void {
    const gain = BASE_LOOPS[EgyptAudioAssetKey.background] ?? 1;
    this.player.setLoop(
      EgyptAudioAssetKey.background,
      this.anticipationActive ? gain * ANTICIPATION_MUSIC_DUCK : gain,
      true,
    );
  }

  private playEffect(key: EgyptAudioAssetKeyType): void {
    this.player.playEffect(key, EFFECT_GAIN[key] ?? 1);
  }
}
