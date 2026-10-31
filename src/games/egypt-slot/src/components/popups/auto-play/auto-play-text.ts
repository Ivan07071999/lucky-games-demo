import { Text } from 'pixi.js';
import { SCROLL_MODAL_COLORS } from '../scroll-modal-theme';

export const makeAutoPlayText = (
  text: string,
  fontSize: number,
  fill: number = SCROLL_MODAL_COLORS.ink,
): Text =>
  new Text({
    text,
    style: { fontFamily: 'Manrope Variable, sans-serif', fontSize, fill },
    anchor: { x: 0, y: 0.5 },
  });
