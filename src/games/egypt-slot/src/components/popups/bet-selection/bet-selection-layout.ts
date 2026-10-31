export const BET_MODAL_MARGIN = 16;
export const BET_MODAL_PADDING_X = 44;
export const BET_MODAL_PADDING_TOP = 48;
export const BET_MODAL_PADDING_BOTTOM = 40;
export const BET_MODAL_TITLE_HEIGHT = 58;
export const BET_OPTION_GAP = 8;
export const BET_OPTION_HEIGHT = 46;

export function getBetSelectionLayout(viewportWidth: number, optionCount: number) {
  const width = Math.max(300, Math.min(520, viewportWidth - BET_MODAL_MARGIN * 2));
  const columns = width >= 480 ? 5 : width >= 360 ? 4 : 3;
  const rows = Math.ceil(optionCount / columns);
  const buttonWidth = (width - BET_MODAL_PADDING_X * 2 - BET_OPTION_GAP * (columns - 1)) / columns;
  const height =
    BET_MODAL_PADDING_TOP +
    BET_MODAL_TITLE_HEIGHT +
    rows * BET_OPTION_HEIGHT +
    (rows - 1) * BET_OPTION_GAP +
    BET_MODAL_PADDING_BOTTOM;

  return { width, height, columns, buttonWidth };
}
