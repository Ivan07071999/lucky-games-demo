import type { Win } from '@lucky-games/contracts';
import type { ReelsMatrix } from '../reels/reelsConfig';
import type { ReelsMachine } from './ReelsMachine';

export interface ReelsCommand {
  execute(machine: ReelsMachine, signal: AbortSignal): void | Promise<void>;
}

export class StartReelsCommand implements ReelsCommand {
  execute(machine: ReelsMachine, signal: AbortSignal): void {
    machine.spin(signal);
  }
}

export class LandReelsCommand implements ReelsCommand {
  private readonly reels: ReelsMatrix;

  constructor(reels: ReelsMatrix) {
    this.reels = reels;
  }

  execute(machine: ReelsMachine, signal: AbortSignal): Promise<void> {
    return machine.land(this.reels, signal);
  }
}

export class SetReelsCommand implements ReelsCommand {
  private readonly reels: ReelsMatrix;

  constructor(reels: ReelsMatrix) {
    this.reels = reels;
  }

  execute(machine: ReelsMachine): void {
    machine.setSymbols(this.reels);
  }
}

export class ShowWildCommand implements ReelsCommand {
  private readonly expandedReels: readonly number[];

  constructor(expandedReels: readonly number[]) {
    this.expandedReels = expandedReels;
  }

  execute(machine: ReelsMachine, signal: AbortSignal): Promise<void> {
    return machine.showWild(this.expandedReels, signal);
  }
}

export class ShowWinLinesCommand implements ReelsCommand {
  private readonly wins: readonly Win[];

  constructor(wins: readonly Win[]) {
    this.wins = wins;
  }

  execute(machine: ReelsMachine, signal: AbortSignal): Promise<void> {
    return machine.showWins(this.wins, signal);
  }
}
