import type { CascadeSequence, ReelAnticipationHint, Win } from '@lucky-games/contracts';
import type { ReelsMatrix } from '../reels/reelsConfig';
import type { ReelsMachine } from './ReelsMachine';

export interface ReelsCommand {
  execute(machine: ReelsMachine, signal: AbortSignal): void | Promise<void>;
}

export class StartReelsCommand implements ReelsCommand {
  private readonly turbo: boolean;

  constructor(turbo = false) {
    this.turbo = turbo;
  }

  execute(machine: ReelsMachine, signal: AbortSignal): void {
    machine.spin(signal, this.turbo);
  }
}

export class StartCascadeCommand implements ReelsCommand {
  private readonly reels: ReelsMatrix;
  private readonly turbo: boolean;

  constructor(reels: ReelsMatrix, turbo = false) {
    this.reels = reels;
    this.turbo = turbo;
  }

  execute(machine: ReelsMachine, signal: AbortSignal): void {
    machine.startCascade(this.reels, signal, this.turbo);
  }
}

export class PlayCascadeCommand implements ReelsCommand {
  private readonly sequence: CascadeSequence;
  private readonly finalReels: ReelsMatrix;
  private readonly turbo: boolean;
  private readonly quickStop: boolean;

  constructor(
    sequence: CascadeSequence,
    finalReels: ReelsMatrix,
    turbo = false,
    quickStop = false,
  ) {
    this.sequence = sequence;
    this.finalReels = finalReels;
    this.turbo = turbo;
    this.quickStop = quickStop;
  }

  execute(machine: ReelsMachine, signal: AbortSignal): Promise<void> {
    return machine.playCascade(this.sequence, this.finalReels, signal, this.turbo, this.quickStop);
  }
}

export class QuickStopCascadeCommand implements ReelsCommand {
  private readonly finalReels: ReelsMatrix;

  constructor(finalReels: ReelsMatrix) {
    this.finalReels = finalReels;
  }

  execute(machine: ReelsMachine): void {
    machine.quickStopCascade(this.finalReels);
  }
}

export class LandReelsCommand implements ReelsCommand {
  private readonly reels: ReelsMatrix;
  private readonly quickStop: boolean;
  private readonly anticipation: ReelAnticipationHint | null;

  constructor(
    reels: ReelsMatrix,
    quickStop = false,
    anticipation: ReelAnticipationHint | null = null,
  ) {
    this.reels = reels;
    this.quickStop = quickStop;
    this.anticipation = anticipation;
  }

  execute(machine: ReelsMachine, signal: AbortSignal): Promise<void> {
    return machine.land(this.reels, signal, this.quickStop, this.anticipation);
  }
}

export class QuickStopReelsCommand implements ReelsCommand {
  private readonly reels: ReelsMatrix;

  constructor(reels: ReelsMatrix) {
    this.reels = reels;
  }

  execute(machine: ReelsMachine, signal: AbortSignal): void {
    machine.requestQuickStop(this.reels, signal);
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

export class ShowFreeSpinsTriggerCommand implements ReelsCommand {
  private readonly reels: ReelsMatrix;

  constructor(reels: ReelsMatrix) {
    this.reels = reels;
  }

  execute(machine: ReelsMachine, signal: AbortSignal): Promise<void> {
    return machine.showFreeSpinsTrigger(this.reels, signal);
  }
}
