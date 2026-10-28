import type {
  ReelAnticipationHint,
  ReelGrid,
  RoundResult,
  SymbolKey,
} from '@lucky-games/contracts';

const FIRST_ANTICIPATION_REEL = 2;
const EXTRA_SPIN_MS = 2400;

export function getReelAnticipationHint(
  reels: ReelGrid,
  mode: RoundResult['mode'],
  scatterSymbol: SymbolKey,
  scatterTriggerCount: number,
): ReelAnticipationHint | null {
  if (mode !== 'BASE_GAME' || scatterTriggerCount < 2) return null;

  let visibleScatters = 0;
  for (let reelIndex = 0; reelIndex < reels.length; reelIndex += 1) {
    if (reelIndex >= FIRST_ANTICIPATION_REEL && visibleScatters === scatterTriggerCount - 1) {
      return { reelIndex, extraSpinMs: EXTRA_SPIN_MS };
    }
    visibleScatters += reels[reelIndex].filter((symbol) => symbol === scatterSymbol).length;
  }

  return null;
}
