import type { ReelsAnimationCue } from '../events/GameEvents';
import { CascadeColumn } from './cascade/CascadeColumn';
import { ReelColumn } from './classic/ReelColumn';
import type { ReelsMatrix } from './reelsConfig';

export function createReelColumns(
  initialReels: ReelsMatrix,
  columnWidth: number,
  rowHeight: number,
  onAnimationCue?: (cue: ReelsAnimationCue) => void,
): { columns: ReelColumn[]; cascadeColumns: CascadeColumn[] } {
  const columns = initialReels.map((values, index) => {
    const column = new ReelColumn(columnWidth, rowHeight, values);
    column.position.x = index * columnWidth;
    column.label = `reel-${index + 1}`;
    return column;
  });

  const cascadeColumns = initialReels.map((values, index) => {
    const column = new CascadeColumn(
      columnWidth,
      rowHeight,
      values,
      () => onAnimationCue?.('cascadeFall'),
      () => onAnimationCue?.('cascadeLand'),
    );
    column.position.x = index * columnWidth;
    column.visible = false;
    return column;
  });

  return { columns, cascadeColumns };
}
