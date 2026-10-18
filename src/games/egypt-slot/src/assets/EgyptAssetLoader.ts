import { Assets, type Texture } from 'pixi.js'
import { EgyptImageAssets } from './EgyptImageAssets'
import { EgyptSpineAssets } from './EgyptSpineAssets'

const imageBundles = {
  scene: EgyptImageAssets.scene,
  symbols: EgyptImageAssets.symbols,
  popups: EgyptImageAssets.popups,
} as const

export type EgyptImageBundle = keyof typeof imageBundles
type EgyptImageAsset<Group extends EgyptImageBundle> = keyof (typeof imageBundles)[Group]

export class EgyptAssetLoader {
  private static registered = false

  static alias<Group extends EgyptImageBundle>(
    group: Group,
    asset: keyof (typeof imageBundles)[Group],
  ): string {
    return `egypt.${group}.${String(asset)}`
  }

  static loadImages(group: EgyptImageBundle) {
    this.registerBundles()
    return Assets.loadBundle(`egypt-${group}`)
  }

  static loadImage<Group extends EgyptImageBundle>(
    group: Group,
    asset: EgyptImageAsset<Group>,
  ): Promise<Texture> {
    this.registerBundles()
    return Assets.load<Texture>(this.alias(group, asset))
  }

  static getImage<Group extends EgyptImageBundle>(
    group: Group,
    asset: EgyptImageAsset<Group>,
  ): Texture {
    const alias = this.alias(group, asset)
    const texture = Assets.get<Texture>(alias)
    if (!texture) throw new Error(`Image asset ${alias} has not been loaded`)
    return texture
  }

  static async loadSpine() {
    EgyptSpineAssets.assertRuntimeCompatible()

    // Importing the runtime registers the .json skeleton and .atlas loaders with PixiJS.
    await import('@esotericsoftware/spine-pixi-v8')

    return Assets.load([
      { alias: 'egypt.anubis.skeleton', src: EgyptSpineAssets.anubis.skeleton },
      { alias: 'egypt.anubis.atlas', src: EgyptSpineAssets.anubis.atlas },
    ])
  }

  private static registerBundles(): void {
    if (this.registered) return

    for (const group of Object.keys(imageBundles) as EgyptImageBundle[]) {
      const assets = Object.entries(imageBundles[group]).map(([asset, src]) => ({
        alias: this.alias(group, asset as keyof (typeof imageBundles)[typeof group]),
        src,
      }))

      Assets.addBundle(`egypt-${group}`, assets)
    }

    this.registered = true
  }
}
