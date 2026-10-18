import { egyptAssetUrl } from './egyptAssetUrl'

export class EgyptSpineAssets {
  static readonly anubis = {
    skeleton: egyptAssetUrl('Spine/character_anubis/character_anubis.json'),
    atlas: egyptAssetUrl('Spine/character_anubis/character_anubis.atlas'),
    texture: egyptAssetUrl('Spine/character_anubis/character_anubis.png'),
  } as const

  // skeleton.spine in character_anubis.json; keep this in sync when replacing the export.
  static readonly exportVersion = '3.8.99'
  static readonly installedRuntimeVersion = '4.3'

  static assertRuntimeCompatible(): void {
    const exportMajorMinor = this.exportVersion.split('.').slice(0, 2).join('.')

    if (exportMajorMinor !== this.installedRuntimeVersion) {
      throw new Error(
        `Anubis was exported from Spine ${this.exportVersion}, but @esotericsoftware/spine-pixi-v8 uses Spine ${this.installedRuntimeVersion}. Re-export the skeleton and atlas with Spine ${this.installedRuntimeVersion}.`,
      )
    }
  }
}
