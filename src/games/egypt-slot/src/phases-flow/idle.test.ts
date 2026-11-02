// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { AutoPlayController } from '../controllers/auto-play-controller/AutoPlayController';
import { GameEmitter } from '../events/GameEmitter';
import type { GameEvents } from '../events/GameEvents';
import { SlotStore } from '../stores/SlotStore';
import { IdlePhase } from './idle';

describe('IdlePhase', () => {
  it('routes a restored bonus to Free Spins without starting its round', async () => {
    const store = new SlotStore();
    const emitter = new GameEmitter<GameEvents>();
    const autoPlay = new AutoPlayController(store, emitter);
    const phase = new IdlePhase(store, emitter, autoPlay);
    store.session.nextAction = 'FREE_SPIN';
    store.session.freeSpins = { remaining: 3, totalWinCoins: 0, stickyReels: [] };

    await expect(phase.enter(new AbortController().signal)).resolves.toBe('freeSpins');
    expect(store.round.stage).toBe('idle');
    autoPlay.destroy();
  });
});
