import { Text } from 'pixi.js';
import { SCROLL_MODAL_COLORS } from '../../scroll-modal-theme';

export const formatWager = (bet: number, level: number, totalBetCoins: number): string =>
  `BET ${bet} × LEVEL ${level} = ${totalBetCoins.toLocaleString('en-US')} COINS`;

export const formatPayouts = (coefficients: readonly number[], totalBetCoins: number): string =>
  [5, 4, 3]
    .map(
      (count) =>
        `${count}  ·  ${(coefficients[count - 3] * totalBetCoins).toLocaleString('en-US')}`,
    )
    .join('\n');

export const formatWildDescription = (multiplier: number): string =>
  `Substitutes for paying symbols. Expands to a reel; line wins ×${multiplier}. ` +
  'Sticky in Free Spins.';

export const formatScarabDescription = (triggerCount: number, freeSpinsAwarded: number): string =>
  `${triggerCount}+ on a paid spin award ${freeSpinsAwarded} Free Spins. No line payout.`;

export const makePaytableText = (text: string, size: number, bold = false): Text =>
  new Text({
    text,
    style: {
      fontFamily: 'Manrope Variable, sans-serif',
      fontSize: size,
      fontWeight: bold ? '800' : '600',
      fill: bold ? SCROLL_MODAL_COLORS.heading : SCROLL_MODAL_COLORS.ink,
      align: 'center',
    },
    anchor: { x: 0.5, y: 0 },
  });
