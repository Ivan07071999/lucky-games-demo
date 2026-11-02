import { makeAutoObservable } from 'mobx';

const STORAGE_KEY = 'egypt-slot.audio';
export const DEFAULT_AUDIO_VOLUME = 0.35;
let saveWarningShown = false;

function readVolume(): number {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const value: unknown = JSON.parse(stored);
      if (typeof value === 'object' && value !== null) {
        const volume = (value as { volume?: unknown }).volume;
        if (typeof volume === 'number' && Number.isFinite(volume)) {
          return Math.max(0, Math.min(1, volume));
        }
      }
    }
  } catch (error) {
    console.warn('Could not read saved audio volume. Using the default volume.', error);
    return DEFAULT_AUDIO_VOLUME;
  }
  return DEFAULT_AUDIO_VOLUME;
}

export class AudioStore {
  muted = true;
  volume = readVolume();

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume)) return;
    this.volume = Math.max(0, Math.min(1, volume));
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume: this.volume }));
    } catch (error) {
      if (saveWarningShown) return;
      saveWarningShown = true;
      console.warn('Could not save audio volume. The new volume will last until reload.', error);
    }
  }
}
