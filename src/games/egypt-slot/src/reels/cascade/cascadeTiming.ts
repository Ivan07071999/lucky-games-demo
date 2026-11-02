const CASCADE_REEL_INTERVAL_SECONDS = 0.16;
const TURBO_CASCADE_REEL_INTERVAL_SECONDS = 0.045;

export function reelDelay(index: number, turbo: boolean): number {
  return index * (turbo ? TURBO_CASCADE_REEL_INTERVAL_SECONDS : CASCADE_REEL_INTERVAL_SECONDS);
}
