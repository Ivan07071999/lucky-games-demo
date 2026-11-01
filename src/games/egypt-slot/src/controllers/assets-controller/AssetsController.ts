import { EgyptAssetLoader, type EgyptAudioAssetKeyType } from '../../assets';

export class AssetsController {
  private readonly loader = new EgyptAssetLoader();

  loadAll(): Promise<void> {
    return this.loader.loadAll();
  }

  loadAudio(asset: EgyptAudioAssetKeyType) {
    return this.loader.loadAudio(asset);
  }

  destroy(): void {
    this.loader.destroy();
  }
}
