import type { WinType } from '@lucky-games/contracts';
import { EgyptImageAssetKey } from '../../assets';

export type PopupWinType = Extract<WinType, 'BIG_WIN' | 'MEGA_WIN' | 'SUPER_MEGA_WIN'>;

export const WIN_POPUP_ASSETS = {
  BIG_WIN: {
    background: EgyptImageAssetKey.popups.bigWinBackground,
    decor: EgyptImageAssetKey.popups.bigWinDecor,
    title: EgyptImageAssetKey.popups.bigWin,
  },
  MEGA_WIN: {
    background: EgyptImageAssetKey.popups.megaWinBackground,
    decor: EgyptImageAssetKey.popups.megaWinDecor,
    title: EgyptImageAssetKey.popups.megaWin,
  },
  SUPER_MEGA_WIN: {
    background: EgyptImageAssetKey.popups.superMegaWinBackground,
    decor: EgyptImageAssetKey.popups.superMegaWinDecor,
    title: EgyptImageAssetKey.popups.superMegaWin,
  },
} as const satisfies Record<PopupWinType, { background: string; decor: string; title: string }>;

export const WIN_POPUP_LAYOUT = {
  width: 620,
  height: 500,
  viewportMargin: 20,
  backdrop: { color: 0x080310, alpha: 0.68 },
  background: { width: 560 },
  decor: { width: 235, y: -143 },
  title: { width: 420, y: -7 },
  amount: { width: 390, y: 112, fontSize: 86, fontFamily: 'LuckyGoldDigits' },
} as const;

export function isPopupWinType(winType: WinType): winType is PopupWinType {
  return Object.hasOwn(WIN_POPUP_ASSETS, winType);
}
