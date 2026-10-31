import { Text } from 'pixi.js';
import { SCROLL_MODAL_COLORS } from '../scroll-modal-theme';

export function settingsText(
  content: string,
  fontSize: number,
  color: number = SCROLL_MODAL_COLORS.ink,
  wrap = false,
): Text {
  return new Text({
    text: content,
    style: {
      fontFamily: 'Manrope Variable, sans-serif',
      fontSize,
      fill: color,
      wordWrap: wrap,
    },
  });
}
