import { SLOT_MATH, assertSlotMathConfig, type SlotMathConfig } from '../src/game/mathConfig.js';
import { evaluateRound, generateReels } from '../src/game/rules.js';

const TWO_TO_32 = 0x1_0000_0000;

function createSeededRandom(seed: number): (maxExclusive: number) => number {
  if (!Number.isSafeInteger(seed) || seed >>> 0 === 0) {
    throw new Error('Seed must contain a nonzero 32-bit value');
  }
  let state = seed >>> 0;
  return (maxExclusive) => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return Math.floor(((state >>> 0) / TWO_TO_32) * maxExclusive);
  };
}

export function simulateMath(config: SlotMathConfig, paidSpins: number, seed = 20261027) {
  assertSlotMathConfig(config);
  if (!Number.isSafeInteger(paidSpins) || paidSpins <= 0) {
    throw new Error('Paid spin count must be a positive safe integer');
  }
  const random = createSeededRandom(seed);
  const bet = { bet: 15, level: 1, totalCoins: 15 };
  let baseWinCoins = 0;
  let bonusWinCoins = 0;
  let paidWins = 0;
  let bonusTriggers = 0;
  let freeSpins = 0;

  for (let spin = 0; spin < paidSpins; spin += 1) {
    const base = evaluateRound(
      generateReels(random, 'BASE_GAME', config),
      bet,
      'BASE_GAME',
      [],
      config,
    );
    baseWinCoins += base.totalWinCoins;
    if (base.totalWinCoins > 0) paidWins += 1;
    if (!base.features.freeSpins.triggered) continue;

    bonusTriggers += 1;
    let stickyReels: number[] = [];
    for (let freeSpin = 0; freeSpin < config.freeSpinsAwarded; freeSpin += 1) {
      const bonus = evaluateRound(
        generateReels(random, 'FREE_SPINS', config),
        bet,
        'FREE_SPINS',
        stickyReels,
        config,
      );
      bonusWinCoins += bonus.totalWinCoins;
      stickyReels = bonus.features.wild.stickyReels;
      freeSpins += 1;
    }
  }

  const wageredCoins = paidSpins * bet.totalCoins;
  return {
    paidSpins,
    seed,
    rtpPercent: Number((((baseWinCoins + bonusWinCoins) / wageredCoins) * 100).toFixed(3)),
    baseRtpPercent: Number(((baseWinCoins / wageredCoins) * 100).toFixed(3)),
    bonusRtpPercent: Number(((bonusWinCoins / wageredCoins) * 100).toFixed(3)),
    paidHitPercent: Number(((paidWins / paidSpins) * 100).toFixed(3)),
    bonusTriggerPercent: Number(((bonusTriggers / paidSpins) * 100).toFixed(3)),
    freeSpins,
  };
}

if (process.argv[1]?.endsWith('simulateMath.ts')) {
  const paidSpins = Number(process.argv[2] ?? 200_000);
  const seed = Number(process.argv[3] ?? 20261027);
  console.log(JSON.stringify(simulateMath(SLOT_MATH, paidSpins, seed), null, 2));
}
