import type { ReelColumnSymbols } from '../reelsConfig';

type SymbolValue = ReelColumnSymbols[number];

export interface CascadeRefillPlan {
  incoming: {
    sourceRow: number;
    value: SymbolValue;
    startRow: number;
    targetRow: number;
    delayOrder: number;
  }[];
  survivors: {
    sourceRow: number;
    value: SymbolValue;
    targetRow: number;
  }[];
  finalSourceRows: number[];
}

export function partitionCascadeRows(
  rowCount: number,
  removedRows: readonly number[],
): { removed: number[]; survivors: number[] } {
  const removed = new Set(removedRows);
  const rows = Array.from({ length: rowCount }, (_, row) => row);
  return {
    removed: rows.filter((row) => removed.has(row)),
    survivors: rows.filter((row) => !removed.has(row)),
  };
}

export function planCascadeRefill(
  rowCount: number,
  removedRows: readonly number[],
  values: ReelColumnSymbols,
): CascadeRefillPlan {
  const { removed, survivors } = partitionCascadeRows(rowCount, removedRows);

  return {
    incoming: removed.map((sourceRow, row) => ({
      sourceRow,
      value: values[row],
      startRow: row - removed.length,
      targetRow: row,
      delayOrder: removed.length - 1 - row,
    })),
    survivors: survivors.map((sourceRow, index) => ({
      sourceRow,
      value: values[removed.length + index],
      targetRow: removed.length + index,
    })),
    finalSourceRows: [...removed, ...survivors],
  };
}
