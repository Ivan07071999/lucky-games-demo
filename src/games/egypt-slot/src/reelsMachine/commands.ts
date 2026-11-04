import type { CascadeSequence, ReelAnticipationHint, Win } from '@lucky-games/contracts';
import type { ReelsMatrix } from '../reels/reelsConfig';
import type { ReelsMachine } from './ReelsMachine';

export type ReelsCommand = (machine: ReelsMachine, signal: AbortSignal) => void | Promise<void>;

type CascadePlaybackOptions = {
  turbo: boolean;
  quickStop: boolean;
  hybrid: boolean;
};

export const reelsCommands = {
  startReels(turbo = false): ReelsCommand {
    return (machine, signal) => machine.spin(signal, turbo);
  },

  startCascade(reels: ReelsMatrix, turbo = false): ReelsCommand {
    return (machine, signal) => machine.startCascade(reels, signal, turbo);
  },

  playCascade(
    sequence: CascadeSequence,
    finalReels: ReelsMatrix,
    options: CascadePlaybackOptions,
  ): ReelsCommand {
    return (machine, signal) =>
      machine.playCascade(
        sequence,
        finalReels,
        signal,
        options.turbo,
        options.quickStop,
        options.hybrid,
      );
  },

  quickStopCascade(finalReels: ReelsMatrix): ReelsCommand {
    return (machine) => machine.quickStopCascade(finalReels);
  },

  landReels(
    reels: ReelsMatrix,
    quickStop = false,
    anticipation: ReelAnticipationHint | null = null,
  ): ReelsCommand {
    return (machine, signal) => machine.land(reels, signal, quickStop, anticipation);
  },

  quickStopReels(reels: ReelsMatrix): ReelsCommand {
    return (machine, signal) => machine.requestQuickStop(reels, signal);
  },

  setReels(reels: ReelsMatrix): ReelsCommand {
    return (machine) => machine.setSymbols(reels);
  },

  showWild(expandedReels: readonly number[]): ReelsCommand {
    return (machine, signal) => machine.showWild(expandedReels, signal);
  },

  showWinLines(wins: readonly Win[]): ReelsCommand {
    return (machine, signal) => machine.showWins(wins, signal);
  },

  showFreeSpinsTrigger(reels: ReelsMatrix): ReelsCommand {
    return (machine, signal) => machine.showFreeSpinsTrigger(reels, signal);
  },
};
