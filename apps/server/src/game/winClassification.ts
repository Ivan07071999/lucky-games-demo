import type { WinClassification } from '@lucky-games/contracts';

export function classifyWin(totalWinCoins: number, totalBetCoins: number): WinClassification {
  if (!Number.isSafeInteger(totalBetCoins) || totalBetCoins <= 0) {
    throw new Error('INVALID_BET');
  }

  const winMultiplier = totalWinCoins / totalBetCoins;
  if (totalWinCoins <= 0) return { winType: 'NO_WIN', winMultiplier };
  if (totalWinCoins >= totalBetCoins * 100) {
    return { winType: 'SUPER_MEGA_WIN', winMultiplier };
  }
  if (totalWinCoins >= totalBetCoins * 50) return { winType: 'MEGA_WIN', winMultiplier };
  if (totalWinCoins >= totalBetCoins * 15) return { winType: 'BIG_WIN', winMultiplier };
  return { winType: 'NORMAL_WIN', winMultiplier };
}
