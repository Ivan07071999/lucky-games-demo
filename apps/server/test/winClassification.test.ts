import { describe, expect, it } from 'vitest';
import { classifyWin } from '../src/game/winClassification.js';

describe('win classification', () => {
  it.each([
    [0, 'NO_WIN'],
    [1, 'NORMAL_WIN'],
    [224, 'NORMAL_WIN'],
    [225, 'BIG_WIN'],
    [749, 'BIG_WIN'],
    [750, 'MEGA_WIN'],
    [1499, 'MEGA_WIN'],
    [1500, 'SUPER_MEGA_WIN'],
  ] as const)('classifies %i coins against a 15 coin bet as %s', (winCoins, winType) => {
    expect(classifyWin(winCoins, 15)).toEqual({
      winType,
      winMultiplier: winCoins / 15,
    });
  });

  it('rejects a zero base bet', () => {
    expect(() => classifyWin(100, 0)).toThrow('INVALID_BET');
  });
});
