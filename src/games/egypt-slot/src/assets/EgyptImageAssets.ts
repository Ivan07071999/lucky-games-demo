import { egyptAssetUrl } from './egyptAssetUrl'

export class EgyptImageAssets {
  static readonly buttons = {
    left: egyptAssetUrl('PNG/buttons/button_left.png'),
    panelBackground: egyptAssetUrl('PNG/background/panel_background.png'),
    right: egyptAssetUrl('PNG/buttons/button_right.png'),
    spinButton: egyptAssetUrl('PNG/buttons/spin_button.png'),
  } as const

  static readonly scene = {
    background: egyptAssetUrl('PNG/background/background.webp'),
    anubis: egyptAssetUrl('PNG/characters/anubis.png'),
    anubisFrame: egyptAssetUrl('PNG/characters/anubis_frame.png'),
    logoLong: egyptAssetUrl('PNG/logo/logo_long.png'),
    logoShort: egyptAssetUrl('PNG/logo/logo_short.png'),
    reelFrameEmpty: egyptAssetUrl('PNG/reel/reel_frame_empty.png'),
    reelFrameFilled: egyptAssetUrl('PNG/reel/reel_frame_filled.png'),
  } as const

  static readonly symbols = {
    highAnkh: egyptAssetUrl('PNG/symbols/high/high_ankh.png'),
    highAnkhNoFrame: egyptAssetUrl('PNG/symbols/high/high_ankh_no_frame.png'),
    highEye: egyptAssetUrl('PNG/symbols/high/high_eye.png'),
    highEyeNoFrame: egyptAssetUrl('PNG/symbols/high/high_eye_no_frame.png'),
    highNecklace: egyptAssetUrl('PNG/symbols/high/high_necklace.png'),
    highNecklaceNoFrame: egyptAssetUrl('PNG/symbols/high/high_necklace_no_frame.png'),
    highScarab: egyptAssetUrl('PNG/symbols/high/high_scarab.png'),
    highScarabNoFrame: egyptAssetUrl('PNG/symbols/high/high_scarab_no_frame.png'),
    wild: egyptAssetUrl('PNG/symbols/wild/wild.png'),
  } as const

  static readonly popups = {
    bigWin: egyptAssetUrl('PNG/popups/big_win.png'),
    bigWinDecor: egyptAssetUrl('PNG/popups/big_win_decor.png'),
  } as const
}
