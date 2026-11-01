import type { WinType } from '@lucky-games/contracts';
import { EgyptAudioAssetKey, type EgyptAudioAssetKeyType } from '../../assets';

export const BASE_LOOPS: Partial<Record<EgyptAudioAssetKeyType, number>> = {
  [EgyptAudioAssetKey.background]: 0.2,
  [EgyptAudioAssetKey.templeAmbientLoop]: 0.18,
};

export const PRELOAD_AUDIO = [
  EgyptAudioAssetKey.uiHover,
  EgyptAudioAssetKey.uiClick,
  EgyptAudioAssetKey.uiBetChange,
  EgyptAudioAssetKey.reelStop,
  EgyptAudioAssetKey.winLine,
] as const satisfies readonly EgyptAudioAssetKeyType[];

export const EFFECT_GAIN: Partial<Record<EgyptAudioAssetKeyType, number>> = {
  [EgyptAudioAssetKey.uiHover]: 1.2,
  [EgyptAudioAssetKey.reelStop]: 0.7,
  [EgyptAudioAssetKey.winLine]: 0.55,
  [EgyptAudioAssetKey.cascadeFall]: 0.32,
  [EgyptAudioAssetKey.cascadeLand]: 0.5,
  [EgyptAudioAssetKey.uiClick]: 0.6,
  [EgyptAudioAssetKey.uiBetChange]: 0.7,
};

export const WIN_SOUND: Record<WinType, EgyptAudioAssetKeyType | null> = {
  NO_WIN: null,
  NORMAL_WIN: EgyptAudioAssetKey.win,
  BIG_WIN: EgyptAudioAssetKey.bigWin,
  MEGA_WIN: EgyptAudioAssetKey.megaWin,
  SUPER_MEGA_WIN: EgyptAudioAssetKey.megaWin,
};

export const ANTICIPATION_GAIN = 2.2;
export const ANTICIPATION_MUSIC_DUCK = 0.45;
export const CASCADE_CUE_INTERVAL_MS = 90;
