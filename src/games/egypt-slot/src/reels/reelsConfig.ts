import type { Reel, ReelGrid, SymbolKey } from '@lucky-games/contracts';

export const REEL_COUNT = 5;
export const VISIBLE_ROWS = 3;

export type ReelSymbolKey = SymbolKey;
export type ReelColumnSymbols = Readonly<Reel>;

type ReadonlyGrid<Grid extends readonly (readonly SymbolKey[])[]> = {
  readonly [Index in keyof Grid]: Readonly<Grid[Index]>;
};

export type ReelsMatrix = ReadonlyGrid<ReelGrid>;

export const INITIAL_REELS = [
  ['highAnkh', 'highEye', 'highNecklace'],
  ['highScarab', 'defaultA', 'defaultQ'],
  ['highEye', 'wild', 'highAnkh'],
  ['defaultK', 'highNecklace', 'highScarab'],
  ['highScarab', 'defaultJ', 'highEye'],
] as const satisfies ReelsMatrix;
