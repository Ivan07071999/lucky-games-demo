export const EgyptAudioAssetKey = {
  background: 'egypt.audio.background',
  freeSpinsIntro: 'egypt.audio.freeSpinsIntro',
  freeSpinsOutro: 'egypt.audio.freeSpinsOutro',
  reelStop: 'egypt.audio.reelStop',
  hover: 'egypt.audio.hover',
  spinStart: 'egypt.audio.spinStart',
  templeAmbientLoop: 'egypt.audio.templeAmbientLoop',
  uiBetChange: 'egypt.audio.uiBetChange',
  uiClick: 'egypt.audio.uiClick',
  uiMenuOpen: 'egypt.audio.uiMenuOpen',
  win: 'egypt.audio.win',
  bigWin: 'egypt.audio.bigWin',
  megaWin: 'egypt.audio.megaWin',
} as const;

export type EgyptAudioAssetKey = (typeof EgyptAudioAssetKey)[keyof typeof EgyptAudioAssetKey];
