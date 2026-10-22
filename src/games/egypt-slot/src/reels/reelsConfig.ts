import { EgyptImageAssetKey } from '../assets';

export const REEL_COUNT = 5;
export const VISIBLE_ROWS = 3;

export type ReelSymbolKey = keyof typeof EgyptImageAssetKey.symbols;
export type ReelSymbols = readonly (readonly ReelSymbolKey[])[];

// Columns are listed from left to right; symbols in each column run from top to bottom.
export const INITIAL_REELS = [
  ['highAnkh', 'highEye', 'highNecklace'],
  ['highScarab', 'defaultA', 'defaultQ'],
  ['highEye', 'wild', 'highAnkh'],
  ['defaultK', 'highNecklace', 'highScarab'],
  ['highScarab', 'defaultJ', 'highEye'],
] as const satisfies ReelSymbols;
