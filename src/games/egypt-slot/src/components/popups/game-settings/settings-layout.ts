export const SETTINGS_MARGIN = 16;
export const SETTINGS_PADDING_X = 52;
export const SETTINGS_PADDING_TOP = 64;
export const SETTINGS_COLUMN_GAP = 28;

export function getSettingsLayout(wide: boolean) {
  const width = wide ? 680 : 460;
  const height = wide ? 720 : 1015;
  const contentWidth = width - SETTINGS_PADDING_X * 2;
  const columnWidth = (contentWidth - SETTINGS_COLUMN_GAP) / 2;
  const rightX = SETTINGS_PADDING_X + columnWidth + SETTINGS_COLUMN_GAP;
  const sectionWidth = wide ? columnWidth : contentWidth;

  return { width, height, contentWidth, columnWidth, rightX, sectionWidth };
}
