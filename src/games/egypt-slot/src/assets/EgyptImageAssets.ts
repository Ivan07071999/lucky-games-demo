import { egyptAssetUrl } from './egyptAssetUrl';

export class EgyptImageAssets {
  static readonly buttons = {
    left: egyptAssetUrl('PNG/buttons/button_left.png'),
    panelBackground: egyptAssetUrl('PNG/background/panel_background.png'),
    right: egyptAssetUrl('PNG/buttons/button_right.png'),
    spinButton: egyptAssetUrl('PNG/buttons/spin_button.png'),
    spinningButton: egyptAssetUrl('PNG/buttons/spining-button.png'),
  } as const;

  static readonly scene = {
    background: egyptAssetUrl('PNG/background/background.webp'),
    anubis: egyptAssetUrl('PNG/characters/anubis.png'),
    anubisFrame: egyptAssetUrl('PNG/characters/anubis_frame.png'),
    logoLong: egyptAssetUrl('PNG/logo/logo_long.png'),
    logoShort: egyptAssetUrl('PNG/logo/logo_short.png'),
    reelFrameEmpty: egyptAssetUrl('PNG/reel/reel_frame_empty.png'),
    reelFrameFilled: egyptAssetUrl('PNG/reel/reel_frame_filled.png'),
  } as const;

  static readonly symbols = {
    defaultA: egyptAssetUrl('PNG/symbols/default/default_a.png'),
    defaultJ: egyptAssetUrl('PNG/symbols/default/default_j.png'),
    defaultK: egyptAssetUrl('PNG/symbols/default/default_k.png'),
    defaultQ: egyptAssetUrl('PNG/symbols/default/default_q.png'),
    highAnkh: egyptAssetUrl('PNG/symbols/high/high_ankh.png'),
    highAnkhNoFrame: egyptAssetUrl('PNG/symbols/high/high_ankh_no_frame.png'),
    highEye: egyptAssetUrl('PNG/symbols/high/high_eye.png'),
    highEyeNoFrame: egyptAssetUrl('PNG/symbols/high/high_eye_no_frame.png'),
    highNecklace: egyptAssetUrl('PNG/symbols/high/high_necklace.png'),
    highNecklaceNoFrame: egyptAssetUrl('PNG/symbols/high/high_necklace_no_frame.png'),
    highScarab: egyptAssetUrl('PNG/symbols/high/high_scarab.png'),
    highScarabNoFrame: egyptAssetUrl('PNG/symbols/high/high_scarab_no_frame.png'),
    wild: egyptAssetUrl('PNG/symbols/wild/wild.png'),
  } as const;

  static readonly popups = {
    scrollBackground: egyptAssetUrl('PNG/popups/scroll_bg.png'),
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
