import type { IMediaInstance } from '@pixi/sound';
import type { WinType } from '@lucky-games/contracts';
import { reaction, type IReactionDisposer } from 'mobx';
import { EgyptAudioAssetKey, type EgyptAudioAssetKeyType } from '../../assets';
import type { GameEvents } from '../../events';
import type { GameEmitter } from '../../events/GameEmitter';
import type { AudioStore } from '../../stores/AudioStore';
import type { PanelStore } from '../../stores/PanelStore';
import type { AssetsController } from '../assets-controller/AssetsController';

const LOOP_GAIN: Partial<Record<EgyptAudioAssetKeyType, number>> = {
  [EgyptAudioAssetKey.background]: 0.35,
  [EgyptAudioAssetKey.templeAmbientLoop]: 0.18,
};
const EFFECT_GAIN: Partial<Record<EgyptAudioAssetKeyType, number>> = {
  [EgyptAudioAssetKey.hover]: 0.35,
  [EgyptAudioAssetKey.reelStop]: 0.7,
  [EgyptAudioAssetKey.uiClick]: 0.6,
  [EgyptAudioAssetKey.uiBetChange]: 0.7,
};

export class AudioController {
  readonly store: AudioStore;
  private readonly assets: AssetsController;
  private readonly ready = new Set<EgyptAudioAssetKeyType>();
  private readonly pendingLoops = new Set<EgyptAudioAssetKeyType>();
  private readonly loops = new Map<EgyptAudioAssetKeyType, IMediaInstance>();
  private readonly effects = new Map<IMediaInstance, number>();
  private readonly unsubscribe: (() => void)[];
  private readonly stopBetReaction: IReactionDisposer;
  private audio: typeof import('@pixi/sound') | null = null;
  private activation: Promise<void> | null = null;
  private lastHoverAt = 0;
  private loading = false;
  private disposed = false;

  constructor(
    assets: AssetsController,
    store: AudioStore,
    emitter: GameEmitter<GameEvents>,
    panel: PanelStore,
  ) {
    this.assets = assets;
    this.store = store;
    this.unsubscribe = [
      emitter.on('spin:started', () => this.playEffect(EgyptAudioAssetKey.spinStart)),
      emitter.on('reel:stopped', () => this.playEffect(EgyptAudioAssetKey.reelStop)),
    ];
    this.stopBetReaction = reaction(
      () => [panel.bet, panel.level],
      () => this.playEffect(EgyptAudioAssetKey.uiBetChange),
    );
  }

  load(): void {
    if (this.store.muted || this.disposed) return;
    this.activate();
  }

  private loadAssets(): void {
    if (this.loading || this.disposed) return;
    this.loading = true;
    for (const key of Object.values(EgyptAudioAssetKey)) {
      void this.assets.loadAudio(key).then(
        () => {
          if (this.disposed) return;
          this.ready.add(key);
          if (key in LOOP_GAIN && !this.store.muted) this.playLoop(key);
        },
        (error: unknown) => {
          if (!this.disposed) console.warn(`Failed to load Egypt slot audio ${key}`, error);
        },
      );
    }
  }

  setMuted(muted: boolean): void {
    if (this.disposed) return;
    this.store.setMuted(muted);
    for (const instance of this.loops.values()) instance.muted = muted;
    for (const instance of this.effects.keys()) instance.muted = muted;
    if (!muted) {
      this.activate();
      for (const key of Object.keys(LOOP_GAIN) as EgyptAudioAssetKeyType[]) this.playLoop(key);
    }
  }

  setVolume(volume: number): void {
    if (this.disposed) return;
    this.store.setVolume(volume);
    for (const [key, instance] of this.loops) {
      instance.volume = this.store.volume * (LOOP_GAIN[key] ?? 1);
    }
    for (const [instance, gain] of this.effects) instance.volume = this.store.volume * gain;
  }

  playHover(): void {
    const now = Date.now();
    if (now - this.lastHoverAt < 100) return;
    this.lastHoverAt = now;
    this.playEffect(EgyptAudioAssetKey.hover);
  }

  playClick(): void {
    this.playEffect(EgyptAudioAssetKey.uiClick);
  }

  playMenuOpen(): void {
    this.playEffect(EgyptAudioAssetKey.uiMenuOpen);
  }

  playFreeSpinsIntro(): void {
    this.playEffect(EgyptAudioAssetKey.freeSpinsIntro);
  }

  playFreeSpinsOutro(): void {
    this.playEffect(EgyptAudioAssetKey.freeSpinsOutro);
  }

  playWin(type: WinType): void {
    const key = {
      NO_WIN: null,
      NORMAL_WIN: EgyptAudioAssetKey.win,
      BIG_WIN: EgyptAudioAssetKey.bigWin,
      MEGA_WIN: EgyptAudioAssetKey.megaWin,
      SUPER_MEGA_WIN: EgyptAudioAssetKey.megaWin,
    }[type];
    if (key) this.playEffect(key);
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribe.forEach((unsubscribe) => unsubscribe());
    this.stopBetReaction();
    for (const instance of this.loops.values()) instance.stop();
    for (const instance of this.effects.keys()) instance.stop();
    this.loops.clear();
    this.effects.clear();
  }

  private playLoop(key: EgyptAudioAssetKeyType): void {
    if (
      this.disposed ||
      this.store.muted ||
      !this.ready.has(key) ||
      this.loops.has(key) ||
      this.pendingLoops.has(key)
    )
      return;
    this.pendingLoops.add(key);
    void this.start(key, LOOP_GAIN[key] ?? 1, true).then((instance) => {
      this.pendingLoops.delete(key);
      if (instance) this.loops.set(key, instance);
    });
  }

  private playEffect(key: EgyptAudioAssetKeyType): void {
    if (this.disposed || this.store.muted || !this.ready.has(key)) return;
    const gain = EFFECT_GAIN[key] ?? 1;
    void this.start(key, gain, false).then((instance) => {
      if (!instance) return;
      this.effects.set(instance, gain);
      instance.once('end', () => this.effects.delete(instance));
      instance.once('stop', () => this.effects.delete(instance));
    });
  }

  private async start(
    key: EgyptAudioAssetKeyType,
    gain: number,
    loop: boolean,
  ): Promise<IMediaInstance | null> {
    if (!this.audio) return null;
    try {
      const instance = await this.audio.sound.play(key, {
        loop,
        singleInstance: loop,
        volume: this.store.volume * gain,
      });
      if (this.disposed) {
        instance.stop();
        return null;
      }
      instance.muted = this.store.muted;
      instance.volume = this.store.volume * gain;
      return instance;
    } catch (error) {
      if (!this.disposed) console.warn(`Failed to play Egypt slot audio ${key}`, error);
      return null;
    }
  }

  private activate(): void {
    if (this.audio) {
      this.resumeContext();
      return;
    }
    if (this.activation) return;
    this.activation = import('@pixi/sound')
      .then((audio) => {
        if (this.disposed) return;
        this.audio = audio;
        this.resumeContext();
        this.loadAssets();
      })
      .catch((error: unknown) => {
        this.activation = null;
        if (!this.disposed) console.warn('Failed to initialize Egypt slot audio', error);
      });
  }

  private resumeContext(): void {
    if (!this.audio || this.store.muted) return;
    const context = this.audio.sound.context;
    if (context instanceof this.audio.webaudio.WebAudioContext) {
      void context.audioContext.resume().catch(() => undefined);
    }
  }
}
