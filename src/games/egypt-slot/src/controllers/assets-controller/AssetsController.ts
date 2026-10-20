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

  loadBackground() {
    return this.loader.loadImage(EgyptImageAssetKey.scene.background)
  }

  getBackground() {
    return this.loader.getImage(EgyptImageAssetKey.scene.background)
  }

  loadImage(asset: EgyptImageAssetKeyType) {
    return this.loader.loadImage(asset)
  }

  getImage(asset: EgyptImageAssetKeyType) {
    return this.loader.getImage(asset)
  }

  destroy(): void {
    this.loader.destroy()
  }
}
