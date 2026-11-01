import type { Sound } from '@pixi/sound';
import type { Texture } from 'pixi.js';
import { AssetLeasePool } from './AssetLeasePool';
import type { EgyptAudioAssetKey } from './EgyptAudioAssetKey';
import { EgyptBitmapFontAssets } from './EgyptBitmapFontAssets';
import { egyptImageAliases, registerEgyptAssets } from './registerEgyptAssets';

const imagePool = new AssetLeasePool<Texture>('image');
const audioPool = new AssetLeasePool<Sound>('audio');
const fontPool = new AssetLeasePool<unknown>('bitmap font');

const bitmapFonts = [
  EgyptBitmapFontAssets.casinoGold,
  EgyptBitmapFontAssets.casinoGoldBold,
  EgyptBitmapFontAssets.luckyGoldDigits,
];

export class EgyptAssetLoader {
  private readonly images = imagePool.createScope();
  private readonly audio = audioPool.createScope();
  private readonly fonts = fontPool.createScope();
  private disposed = false;

  async loadAll(): Promise<void> {
    if (this.disposed) throw new Error('Asset loader has been destroyed');
    registerEgyptAssets();

    await Promise.all([
      Promise.all(egyptImageAliases.map((alias) => this.images.load(alias))),
      Promise.all(bitmapFonts.map((url) => this.fonts.load(url))),
    ]);

    if (this.disposed) throw new Error('Asset loader has been destroyed');
  }

  async loadAudio(asset: EgyptAudioAssetKey): Promise<Sound> {
    if (this.disposed) throw new Error('Asset loader has been destroyed');
    // Load the sound parser only after a user gesture.
    await import('@pixi/sound');
    if (this.disposed) throw new Error('Asset loader has been destroyed');

    registerEgyptAssets();
    return this.audio.load(asset);
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.images.destroy();
    this.audio.destroy();
    this.fonts.destroy();
  }
}
