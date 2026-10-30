import type {
  Bet,
  ReelGrid,
  RoundResult,
  SlotAnimation,
  SymbolKey,
  Win,
} from '@lucky-games/contracts';
import { DEFAULT_PAYLINE_COUNT, SYMBOLS, type PaylineCount } from '@lucky-games/contracts';
import { SLOT_MATH, type SlotMathConfig } from './mathConfig.js';

export const PAYLINES = SLOT_MATH.paylines;
export const BETS = SLOT_MATH.bets;
export const LEVELS = SLOT_MATH.levels;
export const INITIAL_BALANCE = SLOT_MATH.initialBalance;
export const FREE_SPINS_AWARDED = SLOT_MATH.freeSpinsAwarded;

type RandomInt = (maxExclusive: number) => number;
type WeightedStop = { symbol: SymbolKey; cumulativeWeight: number };
type WeightedTable = { stops: WeightedStop[]; totalWeight: number };
const weightTables = new WeakMap<SlotMathConfig, Record<RoundResult['mode'], WeightedTable>>();

function makeWeightedTable(weights: SlotMathConfig['symbolWeights']['BASE_GAME']): WeightedTable {
  const stops: WeightedStop[] = [];
  let totalWeight = 0;
  for (const symbol of SYMBOLS) {
    const weight = weights[symbol];
    if (!Number.isSafeInteger(weight) || weight < 0) {
      throw new Error(`Invalid weight for ${symbol}`);
    }
    if (weight === 0) continue;
    totalWeight += weight;
    stops.push({ symbol, cumulativeWeight: totalWeight });
  }
  if (!Number.isSafeInteger(totalWeight) || totalWeight === 0) {
    throw new Error('Reel symbol weights must have a positive safe total');
  }
  return { stops, totalWeight };
}

function getWeightedTable(config: SlotMathConfig, mode: RoundResult['mode']): WeightedTable {
  let tables = weightTables.get(config);
  if (!tables) {
    tables = {
      BASE_GAME: makeWeightedTable(config.symbolWeights.BASE_GAME),
      FREE_SPINS: makeWeightedTable(config.symbolWeights.FREE_SPINS),
    };
    weightTables.set(config, tables);
  }
  return tables[mode];
}

export function validateBet(
  bet: number,
  level: number,
  config: SlotMathConfig = SLOT_MATH,
): Bet | null {
  if (!config.bets.includes(bet) || !config.levels.includes(level)) return null;
  return { bet, level, totalCoins: bet * level };
}

export function generateReels(
  randomInt: RandomInt,
  mode: RoundResult['mode'] = 'BASE_GAME',
  config: SlotMathConfig = SLOT_MATH,
): ReelGrid {
  const drawReel = (): ReelGrid[number] => [
    drawSymbol(randomInt, mode, config),
    drawSymbol(randomInt, mode, config),
    drawSymbol(randomInt, mode, config),
  ];
  return [drawReel(), drawReel(), drawReel(), drawReel(), drawReel()];
}

export function drawSymbol(
  randomInt: RandomInt,
  mode: RoundResult['mode'] = 'BASE_GAME',
  config: SlotMathConfig = SLOT_MATH,
): SymbolKey {
  const table = getWeightedTable(config, mode);
  const stop = randomInt(table.totalWeight);
  if (!Number.isInteger(stop) || stop < 0 || stop >= table.totalWeight) {
    throw new Error('Random source returned a value outside the symbol weights');
  }
  const entry = table.stops.find(({ cumulativeWeight }) => stop < cumulativeWeight);
  if (!entry) throw new Error('Reel symbol weight table is inconsistent');
  return entry.symbol;
}

export function evaluateRound(
  reels: ReelGrid,
  bet: Bet,
  mode: RoundResult['mode'],
  stickyReels: number[],
  config: SlotMathConfig = SLOT_MATH,
  paylineCount: PaylineCount = DEFAULT_PAYLINE_COUNT,
): Pick<RoundResult, 'reels' | 'wins' | 'totalWinCoins' | 'features' | 'animations'> {
  const expandedReels: number[] = [];
  const activeSticky = mode === 'FREE_SPINS' ? [...stickyReels] : [];
  for (let reel = 0; reel < reels.length; reel += 1) {
    if (activeSticky.includes(reel) || reels[reel].includes('wild')) {
      reels[reel] = ['wild', 'wild', 'wild'];
      expandedReels.push(reel);
      if (mode === 'FREE_SPINS' && !activeSticky.includes(reel)) activeSticky.push(reel);
    }
  }

  const wins: Win[] = [];
  for (const [lineIndex, rows] of config.paylines.slice(0, paylineCount).entries()) {
    const line = rows.map((row, reel) => reels[reel][row]);
    const symbol = line.find((entry) => entry !== 'wild');
    if (!symbol || symbol === config.scatterSymbol) continue;
    let count = 0;
    for (const entry of line) {
      if (entry !== symbol && entry !== 'wild') break;
      count += 1;
    }
    if (count < 3) continue;
    const basePayoutCoins = config.payouts[symbol][count - 3] * bet.totalCoins;
    if (!basePayoutCoins) continue;
    const multiplier = expandedReels.some((reel) => reel < count) ? config.wildMultiplier : 1;
    wins.push({
      lineId: lineIndex + 1,
      symbol,
      count,
      positions: rows.slice(0, count).map((row, reel) => [reel, row]),
      basePayoutCoins,
      multiplier,
      payoutCoins: basePayoutCoins * multiplier,
    });
  }

  const scatterCount = reels.flat().filter((symbol) => symbol === config.scatterSymbol).length;
  const triggered = mode === 'BASE_GAME' && scatterCount >= config.scatterTriggerCount;
  const multipliers = Object.fromEntries(
    expandedReels.map((reel) => [reel, config.wildMultiplier]),
  );
  const animations: SlotAnimation[] = ['REELS_STOP'];
  if (expandedReels.length) animations.push('WILD_EXPAND', 'MULTIPLIER_SHOW');
  if (wins.length) animations.push('WIN_LINES', 'WIN_COUNTER');
  if (triggered) animations.push('FREE_SPINS_START');

  return {
    reels,
    wins,
    totalWinCoins: wins.reduce((sum, win) => sum + win.payoutCoins, 0),
    features: {
      wild: {
        triggered: expandedReels.length > 0,
        type: 'EXPANDING',
        expandedReels,
        stickyReels: activeSticky.sort((a, b) => a - b),
        multipliers,
      },
      freeSpins: {
        triggered,
        awarded: triggered ? config.freeSpinsAwarded : 0,
        remaining: 0,
        totalWinCoins: 0,
      },
    },
    animations,
  };
}
