export const EgyptAudioAssetKey = {
  background: 'egypt.audio.background',
  freeSpinsIntro: 'egypt.audio.freeSpinsIntro',
  freeSpinsOutro: 'egypt.audio.freeSpinsOutro',
  reelStop: 'egypt.audio.reelStop',
  cascadeFall: 'egypt.audio.cascadeFall',
  cascadeLand: 'egypt.audio.cascadeLand',
  anticipationLoop: 'egypt.audio.anticipationLoop',
  templeAmbientLoop: 'egypt.audio.templeAmbientLoop',
  uiHover: 'egypt.audio.uiHover',
  uiBetChange: 'egypt.audio.uiBetChange',
  uiClick: 'egypt.audio.uiClick',
  win: 'egypt.audio.win',
  winLine: 'egypt.audio.winLine',
  bigWin: 'egypt.audio.bigWin',
  megaWin: 'egypt.audio.megaWin',
} as const;

export type EgyptAudioAssetKey = (typeof EgyptAudioAssetKey)[keyof typeof EgyptAudioAssetKey];
