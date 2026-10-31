export function fitModalToViewport(
  viewportWidth: number,
  viewportHeight: number,
  contentWidth: number,
  contentHeight: number,
  margin: number,
): { scale: number; x: number; y: number } {
  const horizontalMargin = Math.min(margin, viewportWidth * 0.05);
  const verticalMargin = Math.min(margin, viewportHeight * 0.05);
  const scale = Math.min(
    1,
    (viewportWidth - horizontalMargin * 2) / contentWidth,
    (viewportHeight - verticalMargin * 2) / contentHeight,
  );

  return {
    scale,
    x: (viewportWidth - contentWidth * scale) / 2,
    y: (viewportHeight - contentHeight * scale) / 2,
  };
}
