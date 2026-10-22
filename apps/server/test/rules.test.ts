import { describe, expect, it } from 'vitest';
import type { ReelGrid } from '@lucky-games/contracts';
import { evaluateRound, validateBet } from '../src/game/rules.js';

const bet = { bet: 15, level: 1, coinValue: 0.02, totalCoins: 15 };

describe('slot rules', () => {
  it('keeps coin value separate from the coin balance', () => {
    expect(validateBet(15, 1, 0.02)).toEqual(bet);
    expect(validateBet(21, 1, 0.02)).toBeNull();
  });

  it('pays three ankhs on the top line and returns zero-based positions', () => {
    const reels: ReelGrid = [
      ['highAnkh', 'defaultJ', 'defaultQ'],
      ['highAnkh', 'defaultK', 'defaultQ'],
      ['highAnkh', 'defaultA', 'defaultK'],
      ['defaultJ', 'defaultK', 'defaultA'],
      ['defaultQ', 'defaultA', 'defaultJ'],
    ];
    const result = evaluateRound(reels, bet, 'BASE_GAME', []);
    expect(result.wins[0]).toMatchObject({
      lineId: 1,
      symbol: 'highAnkh',
      count: 3,
      positions: [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      payoutCoins: 60,
    });
  });

  it('expands wild reels and applies the multiplier', () => {
    const reels: ReelGrid = [
      ['highAnkh', 'defaultJ', 'defaultQ'],
      ['wild', 'defaultK', 'defaultQ'],
      ['highAnkh', 'defaultA', 'defaultK'],
      ['defaultJ', 'defaultK', 'defaultA'],
      ['defaultQ', 'defaultA', 'defaultJ'],
    ];
    const result = evaluateRound(reels, bet, 'BASE_GAME', []);
    expect(result.reels[1]).toEqual(['wild', 'wild', 'wild']);
    expect(result.wins[0].payoutCoins).toBe(180);
    expect(result.features.wild.expandedReels).toEqual([1]);
  });

  it('awards eight free spins on three scarabs', () => {
    const reels: ReelGrid = [
      ['highScarab', 'defaultJ', 'defaultQ'],
      ['highScarab', 'defaultK', 'defaultQ'],
      ['highScarab', 'defaultA', 'defaultK'],
      ['defaultJ', 'defaultK', 'defaultA'],
      ['defaultQ', 'defaultA', 'defaultJ'],
    ];
    expect(evaluateRound(reels, bet, 'BASE_GAME', []).features.freeSpins).toMatchObject({
      triggered: true,
      awarded: 8,
    });
  });
});
