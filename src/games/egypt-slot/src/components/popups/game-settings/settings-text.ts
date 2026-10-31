import { Text } from 'pixi.js';
import { SCROLL_MODAL_COLORS, SCROLL_MODAL_FONT_FAMILY } from '../shared/scroll-modal-theme';

export function settingsText(
  content: string,
  fontSize: number,
  color: number = SCROLL_MODAL_COLORS.ink,
  wrap = false,
): Text {
  return new Text({
    text: content,
    style: {
      fontFamily: SCROLL_MODAL_FONT_FAMILY,
      fontSize,
      fill: color,
      wordWrap: wrap,
    },
  });
}
