import type { Win } from '@lucky-games/contracts';
import { REEL_COUNT } from './reelsConfig';

export function getWinRows(win: Win): number[][] {
  const rows = Array.from({ length: REEL_COUNT }, () => new Set<number>());
  win.positions.forEach(([reelIndex, rowIndex]) => rows[reelIndex]?.add(rowIndex));
  return rows.map((positions) => [...positions]);
}
