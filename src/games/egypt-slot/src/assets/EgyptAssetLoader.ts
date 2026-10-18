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

type ImageLease = {
  users: number
  promise: Promise<Texture>
  unloading: Promise<void> | null
}

export class EgyptAssetLoader {
  private static registered = false
  private static readonly imageLeases = new Map<string, ImageLease>()
  private readonly acquiredImages = new Set<string>()
  private disposed = false

  static alias(group: EgyptImageBundle, asset: PropertyKey): string {
    return `egypt.${group}.${String(asset)}`
  }

  async loadImages(group: EgyptImageBundle): Promise<Record<string, Texture>> {
    this.registerBundles()
    const names = Object.keys(imageBundles[group])
    const textures = await Promise.all(
      names.map(
        async (name) =>
          [name, await this.acquireImage(EgyptAssetLoader.alias(group, name))] as const,
      ),
    )
    return Object.fromEntries(textures)
  }

  loadImage<Group extends EgyptImageBundle>(
    group: Group,
    asset: EgyptImageAsset<Group>,
  ): Promise<Texture> {
    this.registerBundles()
    return this.acquireImage(EgyptAssetLoader.alias(group, asset))
  }

  getImage<Group extends EgyptImageBundle>(group: Group, asset: EgyptImageAsset<Group>): Texture {
    const alias = EgyptAssetLoader.alias(group, asset)
    const texture = Assets.get<Texture>(alias)
    if (!texture) throw new Error(`Image asset ${alias} has not been loaded`)
    return texture
  }

  async loadSpine() {
    EgyptSpineAssets.assertRuntimeCompatible()

    // Importing the runtime registers the .json skeleton and .atlas loaders with PixiJS.
    await import('@esotericsoftware/spine-pixi-v8')

    return Assets.load([
      { alias: 'egypt.anubis.skeleton', src: EgyptSpineAssets.anubis.skeleton },
      { alias: 'egypt.anubis.atlas', src: EgyptSpineAssets.anubis.atlas },
    ])
  }

  destroy(): void {
    if (this.disposed) return
    this.disposed = true

    for (const alias of this.acquiredImages) this.releaseImage(alias)
  }

  private async acquireImage(alias: string): Promise<Texture> {
    if (this.disposed) throw new Error('Asset loader has been destroyed')

    let lease = EgyptAssetLoader.imageLeases.get(alias)
    while (lease?.unloading) {
      await lease.unloading
      if (this.disposed) throw new Error('Asset loader has been destroyed')
      lease = EgyptAssetLoader.imageLeases.get(alias)
    }

    if (!lease) {
      lease = { users: 0, promise: Assets.load<Texture>(alias), unloading: null }
      EgyptAssetLoader.imageLeases.set(alias, lease)
    }

    if (!this.acquiredImages.has(alias)) {
      this.acquiredImages.add(alias)
      lease.users++
    }

    try {
      return await lease.promise
    } catch (error) {
      this.releaseImage(alias)
      throw error
    }
  }

  private releaseImage(alias: string): void {
    if (!this.acquiredImages.delete(alias)) return

    const lease = EgyptAssetLoader.imageLeases.get(alias)
    if (!lease || --lease.users > 0) return

    lease.unloading = lease.promise
      .then(
        () => Assets.unload(alias),
        () => undefined,
      )
      .catch((error: unknown) => {
        console.warn(`Failed to unload image asset ${alias}`, error)
      })
      .finally(() => {
        if (EgyptAssetLoader.imageLeases.get(alias) === lease) {
          EgyptAssetLoader.imageLeases.delete(alias)
        }
      })
  }

  private registerBundles(): void {
    if (EgyptAssetLoader.registered) return

    for (const group of Object.keys(imageBundles) as EgyptImageBundle[]) {
      const assets = Object.entries(imageBundles[group]).map(([asset, src]) => ({
        alias: EgyptAssetLoader.alias(group, asset),
        src,
      }))

      Assets.addBundle(`egypt-${group}`, assets)
    }

    EgyptAssetLoader.registered = true
  }
}
