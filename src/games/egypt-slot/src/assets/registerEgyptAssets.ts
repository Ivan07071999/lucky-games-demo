import { Assets } from 'pixi.js';
import { EgyptAudioAssetKey } from './EgyptAudioAssetKey';
import { EgyptAudioAssets } from './EgyptAudioAssets';
import { EgyptImageAssets } from './EgyptImageAssets';

const imageBundles = {
  buttons: EgyptImageAssets.buttons,
  scene: EgyptImageAssets.scene,
  transitions: EgyptImageAssets.transitions,
  symbols: EgyptImageAssets.symbols,
  popups: EgyptImageAssets.popups,
} as const;

const registeredImageBundles = Object.entries(imageBundles).map(([group, assets]) => ({
  name: `egypt-${group}`,
  entries: Object.entries(assets).map(([name, src]) => ({
    alias: `egypt.${group}.${name}`,
    src,
  })),
}));

export const egyptImageAliases = registeredImageBundles.flatMap((bundle) =>
  bundle.entries.map((entry) => entry.alias),
);

let registered = false;

export function registerEgyptAssets(): void {
  if (registered) return;

  for (const bundle of registeredImageBundles) {
    Assets.addBundle(bundle.name, bundle.entries);
  }

  Assets.addBundle(
    'egypt-audio',
    (Object.keys(EgyptAudioAssets) as (keyof typeof EgyptAudioAssets)[]).map((name) => ({
      alias: EgyptAudioAssetKey[name],
      src: EgyptAudioAssets[name],
    })),
  );

  registered = true;
}
