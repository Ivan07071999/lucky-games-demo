import { egyptAssetUrl } from './egyptAssetUrl';

export const EgyptAudioAssets = {
  background: egyptAssetUrl('audio/background/background.m4a'),
  freeSpinsIntro: egyptAssetUrl('audio/free-spins/free_spins_intro.m4a'),
  freeSpinsOutro: egyptAssetUrl('audio/free-spins/free_spins_outro.m4a'),
  reelStop: egyptAssetUrl('audio/reel/reel_stop.m4a'),
  hover: egyptAssetUrl('audio/ui-sound/hover.m4a'),
  spinStart: egyptAssetUrl('audio/ui-sound/spin_start.m4a'),
  templeAmbientLoop: egyptAssetUrl('audio/ui-sound/temple_ambient_loop.m4a'),
  uiBetChange: egyptAssetUrl('audio/ui-sound/ui_bet_change.m4a'),
  uiClick: egyptAssetUrl('audio/ui-sound/ui_click.m4a'),
  uiMenuOpen: egyptAssetUrl('audio/ui-sound/ui_menu_open.m4a'),
  win: egyptAssetUrl('audio/win/win.m4a'),
  bigWin: egyptAssetUrl('audio/win/big_win.m4a'),
  megaWin: egyptAssetUrl('audio/win/mega_win.m4a'),
} as const;
