import { egyptAssetUrl } from './egyptAssetUrl';

export class EgyptImageAssets {
  static readonly buttons = {
    left: egyptAssetUrl('PNG/buttons/button_left.png'),
    panelBackground: egyptAssetUrl('PNG/background/panel_background.png'),
    panelBackgroundFreeSpins: egyptAssetUrl('PNG/background/panel_background_fs.png'),
    right: egyptAssetUrl('PNG/buttons/button_right.png'),
    spinButton: egyptAssetUrl('PNG/buttons/spin_button.png'),
    spinningButton: egyptAssetUrl('PNG/buttons/spining-button.png'),
    settings: egyptAssetUrl('svg/settings.svg'),
    soundOn: egyptAssetUrl('svg/sound_on.svg'),
    soundOff: egyptAssetUrl('svg/sound_off.svg'),
  } as const;

  static readonly scene = {
    background: egyptAssetUrl('PNG/background/background.webp'),
    backgroundFreeSpins: egyptAssetUrl('PNG/background/background_fs.png'),
    logoLong: egyptAssetUrl('PNG/logo/logo_long.png'),
    reelFrameFilled: egyptAssetUrl('PNG/reel/reel_frame_filled.png'),
    reelFrameFreeSpins: egyptAssetUrl('PNG/reel/reel_frame_fs.png'),
  } as const;

  static readonly transitions = {
    freeSpinsActivated: egyptAssetUrl('PNG/transition/transition_fs_activated.png'),
    freeSpinsComplete: egyptAssetUrl('PNG/transition/transition_fs_complete.png'),
  } as const;

  static readonly symbols = {
    defaultA: egyptAssetUrl('PNG/symbols/default/default_a.png'),
    defaultJ: egyptAssetUrl('PNG/symbols/default/default_j.png'),
    defaultK: egyptAssetUrl('PNG/symbols/default/default_k.png'),
    defaultQ: egyptAssetUrl('PNG/symbols/default/default_q.png'),
    highAnkh: egyptAssetUrl('PNG/symbols/high/high_ankh.png'),
    highEye: egyptAssetUrl('PNG/symbols/high/high_eye.png'),
    highNecklace: egyptAssetUrl('PNG/symbols/high/high_necklace.png'),
    highScarab: egyptAssetUrl('PNG/symbols/high/high_scarab.png'),
    wild: egyptAssetUrl('PNG/symbols/wild/wild.png'),
  } as const;

  static readonly popups = {
    info: egyptAssetUrl('svg/info.svg'),
    scrollBackground: egyptAssetUrl('PNG/popups/scroll_bg.png'),
    freeSpinsTablet: egyptAssetUrl('PNG/popups/tablet_bg.png'),
    bigWin: egyptAssetUrl('PNG/popups/big-win/big_win.png'),
    bigWinBackground: egyptAssetUrl('PNG/popups/big-win/big_win_bg.png'),
    bigWinDecor: egyptAssetUrl('PNG/popups/big-win/big_win_decor.png'),
    megaWin: egyptAssetUrl('PNG/popups/mega-win/mega_win.png'),
    megaWinBackground: egyptAssetUrl('PNG/popups/mega-win/mega_win_bg.png'),
    megaWinDecor: egyptAssetUrl('PNG/popups/mega-win/mega_win_decor.png'),
    superMegaWin: egyptAssetUrl('PNG/popups/super-mega-win/super_mega_win.png'),
    superMegaWinBackground: egyptAssetUrl('PNG/popups/super-mega-win/super_mega_win_bg.png'),
    superMegaWinDecor: egyptAssetUrl('PNG/popups/super-mega-win/super_mega_win_decor.png'),
  } as const;
}
