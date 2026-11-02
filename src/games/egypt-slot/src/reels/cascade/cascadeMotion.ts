import type { gsap } from 'gsap';
import type { ReelSymbol } from '../reelSymbol';

type Timeline = ReturnType<typeof gsap.timeline>;

const SYMBOL_INTERVAL_SECONDS = 0.11;
const TURBO_SYMBOL_INTERVAL_SECONDS = 0.025;
const LANDING_PIXELS = 6;
const LANDING_DOWN_SECONDS = 0.07;
const LANDING_RETURN_SECONDS = 0.11;
const TURBO_LANDING_DOWN_SECONDS = 0.035;
const TURBO_LANDING_RETURN_SECONDS = 0.06;

interface FallMotion {
  targetRow: number;
  rowHeight: number;
  startDelay: number;
  duration: number;
  onFall?: () => void;
}

interface LandingMotion {
  targetRow: number;
  rowHeight: number;
  startDelay: number;
  turbo: boolean;
  onLand?: () => void;
}

export function symbolDelay(order: number, turbo: boolean): number {
  return order * (turbo ? TURBO_SYMBOL_INTERVAL_SECONDS : SYMBOL_INTERVAL_SECONDS);
}

export function addFall(
  timeline: Timeline,
  symbol: ReelSymbol,
  { targetRow, rowHeight, startDelay, duration, onFall }: FallMotion,
): void {
  timeline.to(
    symbol,
    {
      y: targetRow * rowHeight,
      alpha: 0,
      duration,
      ease: 'power2.in',
      onStart: onFall,
    },
    startDelay,
  );
}

export function addLanding(
  timeline: Timeline,
  symbol: ReelSymbol,
  { targetRow, rowHeight, startDelay, turbo, onLand }: LandingMotion,
): void {
  const targetY = targetRow * rowHeight;
  const fallSeconds = turbo ? 0.14 : 0.4;
  const offset = Math.min(LANDING_PIXELS, rowHeight * 0.06);
  const downSeconds = turbo ? TURBO_LANDING_DOWN_SECONDS : LANDING_DOWN_SECONDS;
  const returnSeconds = turbo ? TURBO_LANDING_RETURN_SECONDS : LANDING_RETURN_SECONDS;

  timeline.to(
    symbol,
    {
      y: targetY,
      duration: fallSeconds,
      ease: 'power2.out',
      onComplete: onLand,
    },
    startDelay,
  );
  timeline.to(
    symbol,
    { y: targetY + offset, duration: downSeconds, ease: 'power2.out' },
    startDelay + fallSeconds,
  );
  timeline.to(
    symbol,
    { y: targetY, duration: returnSeconds, ease: 'power2.inOut' },
    startDelay + fallSeconds + downSeconds,
  );
}
