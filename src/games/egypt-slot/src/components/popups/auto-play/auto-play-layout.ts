export const AUTO_PLAY_CONTENT_PADDING = 44;
export const AUTO_PLAY_SIDE_MARGIN = 12;

export function getAutoPlayCardLayout(
  viewportWidth: number,
  viewportHeight: number,
): {
  width: number;
  height: number;
  padding: number;
  landscape: boolean;
  compact: boolean;
} {
  const landscape = viewportHeight < 460 && viewportWidth > viewportHeight * 1.2;
  const width = Math.max(
    landscape ? 640 : 320,
    Math.min(landscape ? 760 : 520, viewportWidth - AUTO_PLAY_SIDE_MARGIN * 2),
  );
  const compact = !landscape && width < 390;
  return {
    width,
    height: landscape ? 315 : compact ? 618 : 570,
    padding: compact ? 28 : AUTO_PLAY_CONTENT_PADDING,
    landscape,
    compact,
  };
}
