import type { IMediaInstance } from '@pixi/sound';
import type { EgyptAudioAssetKeyType } from '../../assets';
import type { AudioStore } from '../../stores/AudioStore';
import type { AssetsController } from '../assets-controller/AssetsController';
import { PRELOAD_AUDIO } from './audioConfig';

export class AudioPlayer {
  private readonly assets: AssetsController;
  private readonly store: AudioStore;
  private readonly ready = new Set<EgyptAudioAssetKeyType>();
  private readonly loading = new Map<EgyptAudioAssetKeyType, Promise<boolean>>();
  private readonly desiredLoops = new Map<EgyptAudioAssetKeyType, number>();
  private readonly startingLoops = new Set<EgyptAudioAssetKeyType>();
  private readonly loops = new Map<EgyptAudioAssetKeyType, IMediaInstance>();
  private readonly effects = new Map<IMediaInstance, number>();
  private audio: typeof import('@pixi/sound') | null = null;
  private activation: Promise<void> | null = null;
  private disposed = false;

  constructor(assets: AssetsController, store: AudioStore) {
    this.assets = assets;
    this.store = store;
  }

  enable(): void {
    if (this.disposed || this.store.muted) return;
    void this.activate().then(() => {
      if (!this.audio || this.disposed || this.store.muted) return;
      for (const key of this.desiredLoops.keys()) this.startLoop(key);
      for (const key of PRELOAD_AUDIO) void this.load(key);
    });
  }

  setMuted(muted: boolean): void {
    for (const instance of this.loops.values()) instance.muted = muted;
    for (const instance of this.effects.keys()) instance.muted = muted;
    if (!muted) this.enable();
  }

  setVolume(): void {
    for (const [key, instance] of this.loops) {
      instance.volume = this.store.volume * (this.desiredLoops.get(key) ?? 1);
    }
    for (const [instance, gain] of this.effects) instance.volume = this.store.volume * gain;
  }

  setLoop(key: EgyptAudioAssetKeyType, gain: number, active: boolean): void {
    if (this.disposed) return;
    if (!active) {
      this.desiredLoops.delete(key);
      this.loops.get(key)?.stop();
      this.loops.delete(key);
      return;
    }
    this.desiredLoops.set(key, gain);
    const instance = this.loops.get(key);
    if (instance) instance.volume = this.store.volume * gain;
    else this.startLoop(key);
  }

  playEffect(key: EgyptAudioAssetKeyType, gain = 1): void {
    if (this.disposed || this.store.muted) return;
    void this.load(key).then((loaded) => {
      if (!loaded || this.disposed || this.store.muted) return;
      void this.start(key, gain, false).then((instance) => {
        if (!instance) return;
        this.effects.set(instance, gain);
        instance.once('end', () => this.effects.delete(instance));
        instance.once('stop', () => this.effects.delete(instance));
      });
    });
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const instance of this.loops.values()) instance.stop();
    for (const instance of this.effects.keys()) instance.stop();
    this.desiredLoops.clear();
    this.loops.clear();
    this.effects.clear();
  }

  private startLoop(key: EgyptAudioAssetKeyType): void {
    if (
      this.disposed ||
      this.store.muted ||
      !this.desiredLoops.has(key) ||
      this.loops.has(key) ||
      this.startingLoops.has(key)
    )
      return;

    this.startingLoops.add(key);
    void this.load(key)
      .then(async (loaded) => {
        const gain = this.desiredLoops.get(key);
        if (!loaded || gain === undefined || this.disposed || this.store.muted) return;
        const instance = await this.start(key, gain, true);
        if (!instance) return;
        if (this.disposed || !this.desiredLoops.has(key)) {
          instance.stop();
          return;
        }
        this.loops.set(key, instance);
        instance.volume = this.store.volume * (this.desiredLoops.get(key) ?? gain);
      })
      .finally(() => this.startingLoops.delete(key));
  }

  private load(key: EgyptAudioAssetKeyType): Promise<boolean> {
    if (this.disposed) return Promise.resolve(false);
    if (this.ready.has(key)) return Promise.resolve(true);
    const pending = this.loading.get(key);
    if (pending) return pending;

    const loading = this.activate()
      .then(() => {
        if (this.disposed || !this.audio) return false;
        return this.assets.loadAudio(key).then(() => {
          if (this.disposed) return false;
          this.ready.add(key);
          return true;
        });
      })
      .catch((error: unknown) => {
        if (!this.disposed) console.warn(`Failed to load Egypt slot audio ${key}`, error);
        return false;
      })
      .finally(() => this.loading.delete(key));
    this.loading.set(key, loading);
    return loading;
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

  private activate(): Promise<void> {
    if (this.audio) {
      this.resumeContext();
      return Promise.resolve();
    }
    if (this.activation) return this.activation;
    this.activation = import('@pixi/sound')
      .then((audio) => {
        if (this.disposed) return;
        this.audio = audio;
        this.resumeContext();
      })
      .catch((error: unknown) => {
        if (!this.disposed) console.warn('Failed to initialize Egypt slot audio', error);
      })
      .finally(() => {
        this.activation = null;
      });
    return this.activation;
  }

  private resumeContext(): void {
    if (!this.audio || this.store.muted) return;
    const context = this.audio.sound.context;
    if (context instanceof this.audio.webaudio.WebAudioContext) {
      void context.audioContext.resume().catch(() => undefined);
    }
  }
}
