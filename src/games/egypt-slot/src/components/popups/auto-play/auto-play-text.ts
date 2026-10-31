import { Text } from 'pixi.js';
import { SCROLL_MODAL_COLORS, SCROLL_MODAL_FONT_FAMILY } from '../shared/scroll-modal-theme';

export const makeAutoPlayText = (
  text: string,
  fontSize: number,
  fill: number = SCROLL_MODAL_COLORS.ink,
): Text =>
  new Text({
    text,
    style: { fontFamily: SCROLL_MODAL_FONT_FAMILY, fontSize, fill },
    anchor: { x: 0, y: 0.5 },
  });
