import {
  EgyptAssetLoader,
  EgyptImageAssetKey,
  EgyptImageAssets,
  EgyptSpineAssets,
  type EgyptImageAssetKey as EgyptImageAssetKeyType,
} from '../../assets'

export class AssetsController {
  readonly images = EgyptImageAssets
  readonly spine = EgyptSpineAssets
  readonly loader = new EgyptAssetLoader()

  loadAllImages(): Promise<void> {
    return this.loader.loadAllImages()
  }

  loadAll(): Promise<void> {
    return this.loader.loadAll()
  }

  loadBackground() {
    return this.loader.loadImage(EgyptImageAssetKey.scene.background)
  }

  loadImage(asset: EgyptImageAssetKeyType) {
    return this.loader.loadImage(asset)
  }

  destroy(): void {
    this.loader.destroy()
  }
}
