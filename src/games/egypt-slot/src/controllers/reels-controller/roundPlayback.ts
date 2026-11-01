import type { RoundResult, SpinMode } from '@lucky-games/contracts';

export interface RoundPlayback {
  signal: AbortSignal;
  spinMode: SpinMode;
  turbo: boolean;
  result: RoundResult | null;
  hybridCascadeActive: boolean;
}
