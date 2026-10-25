import {
  EgyptAssetLoader,
  type EgyptAudioAssetKeyType,
  EgyptImageAssetKey,
  EgyptImageAssets,
  EgyptSpineAssets,
  type EgyptImageAssetKey as EgyptImageAssetKeyType,
} from '../../assets';

export class AssetsController {
  readonly images = EgyptImageAssets;
  readonly spine = EgyptSpineAssets;
  readonly loader = new EgyptAssetLoader();

  loadAllImages(): Promise<void> {
    return this.loader.loadAllImages();
  }

  loadAll(): Promise<void> {
    return this.loader.loadAll();
  }

  loadBackground() {
    return this.loader.loadImage(EgyptImageAssetKey.scene.background);
  }

  loadImage(asset: EgyptImageAssetKeyType) {
    return this.loader.loadImage(asset);
  }

  loadBackgroundMusic() {
    return this.loader.loadBackgroundMusic();
  }

  loadAudio(asset: EgyptAudioAssetKeyType) {
    return this.loader.loadAudio(asset);
  }

  destroy(): void {
    this.loader.destroy();
  }
}
