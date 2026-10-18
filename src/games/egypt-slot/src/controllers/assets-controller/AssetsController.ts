import { EgyptAssetLoader, EgyptImageAssets, EgyptSpineAssets } from '../../assets'

export class AssetsController {
  readonly images = EgyptImageAssets
  readonly spine = EgyptSpineAssets
  readonly loader = new EgyptAssetLoader()

  loadBackground() {
    return this.loader.loadImage('scene', 'background')
  }

  getBackground() {
    return this.loader.getImage('scene', 'background')
  }

  destroy(): void {
    this.loader.destroy()
  }
}
