import type { ReelSymbol } from '../reelSymbol';
import type { ReelColumnSymbols } from '../reelsConfig';

type SymbolValue = ReelColumnSymbols[number];

export interface CascadeRefillPlan {
  incoming: {
    symbol: ReelSymbol;
    value: SymbolValue;
    startRow: number;
    targetRow: number;
    delayOrder: number;
  }[];
  survivors: {
    symbol: ReelSymbol;
    value: SymbolValue;
    targetRow: number;
  }[];
  finalSymbols: ReelSymbol[];
}

export function partitionCascadeSymbols(
  symbols: readonly ReelSymbol[],
  removedRows: readonly number[],
) {
  const removed = new Set(removedRows);
  return {
    incoming: symbols.filter((_, row) => removed.has(row)),
    survivors: symbols.filter((_, row) => !removed.has(row)),
  };
}

export function planCascadeRefill(
  symbols: readonly ReelSymbol[],
  removedRows: readonly number[],
  values: ReelColumnSymbols,
): CascadeRefillPlan {
  const { incoming, survivors } = partitionCascadeSymbols(symbols, removedRows);

  return {
    incoming: incoming.map((symbol, row) => ({
      symbol,
      value: values[row],
      startRow: row - incoming.length,
      targetRow: row,
      delayOrder: incoming.length - 1 - row,
    })),
    survivors: survivors.map((symbol, index) => ({
      symbol,
      value: values[incoming.length + index],
      targetRow: incoming.length + index,
    })),
    finalSymbols: [...incoming, ...survivors],
  };
}
