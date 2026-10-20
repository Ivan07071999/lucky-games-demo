import { EgyptImageAssets } from './EgyptImageAssets'

type ImageAssetGroup = keyof typeof EgyptImageAssets
type ImageAssets<Group extends ImageAssetGroup> = (typeof EgyptImageAssets)[Group]

function createAssetKeys<Group extends ImageAssetGroup>(
  group: Group,
  assets: ImageAssets<Group>,
): { [Asset in keyof ImageAssets<Group>]: `egypt.${Group}.${Extract<Asset, string>}` } {
  return Object.fromEntries(
    Object.keys(assets).map((asset) => [asset, `egypt.${group}.${asset}`]),
  ) as { [Asset in keyof ImageAssets<Group>]: `egypt.${Group}.${Extract<Asset, string>}` }
}

export const EgyptImageAssetKey = {
  buttons: createAssetKeys('buttons', EgyptImageAssets.buttons),
  scene: createAssetKeys('scene', EgyptImageAssets.scene),
  symbols: createAssetKeys('symbols', EgyptImageAssets.symbols),
  popups: createAssetKeys('popups', EgyptImageAssets.popups),
} as const

type EgyptImageAssetKeyMap = typeof EgyptImageAssetKey

export type EgyptImageAssetKey = {
  [
    Group in keyof EgyptImageAssetKeyMap
  ]: EgyptImageAssetKeyMap[Group][keyof EgyptImageAssetKeyMap[Group]]
}[keyof EgyptImageAssetKeyMap]
