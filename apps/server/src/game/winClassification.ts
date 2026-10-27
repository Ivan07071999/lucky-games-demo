import type { WinClassification } from '@lucky-games/contracts';
import { SLOT_MATH, type SlotMathConfig } from './mathConfig.js';

export function classifyWin(
  totalWinCoins: number,
  totalBetCoins: number,
  config: SlotMathConfig = SLOT_MATH,
): WinClassification {
  if (!Number.isSafeInteger(totalBetCoins) || totalBetCoins <= 0) {
    throw new Error('INVALID_BET');
  }

  const winMultiplier = totalWinCoins / totalBetCoins;
  if (totalWinCoins <= 0) return { winType: 'NO_WIN', winMultiplier };
  if (totalWinCoins >= totalBetCoins * config.winThresholds.superMega) {
    return { winType: 'SUPER_MEGA_WIN', winMultiplier };
  }
  if (totalWinCoins >= totalBetCoins * config.winThresholds.mega) {
    return { winType: 'MEGA_WIN', winMultiplier };
  }
  if (totalWinCoins >= totalBetCoins * config.winThresholds.big) {
    return { winType: 'BIG_WIN', winMultiplier };
  }
  return { winType: 'NORMAL_WIN', winMultiplier };
}
