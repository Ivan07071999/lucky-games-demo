import { DEFAULT_PAYLINE_COUNT, type SpinMode, type SpinOptions } from '@lucky-games/contracts';
import type { SlotStore } from '../stores/SlotStore';

export function buildSpinOptions(store: SlotStore, spinMode: SpinMode): SpinOptions {
  const { bet, spinSettings, demoSettings } = store;

  return {
    bet: bet.bet,
    level: bet.level,
    paylineCount:
      spinSettings.paylineCount === DEFAULT_PAYLINE_COUNT ? undefined : spinSettings.paylineCount,
    ...demoSettings.getSpinOptions(spinMode),
    spinMode: spinMode === 'CLASSIC' ? undefined : spinMode,
  };
}
