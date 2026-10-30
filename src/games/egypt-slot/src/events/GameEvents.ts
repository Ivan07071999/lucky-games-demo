import type { RoundResult } from '@lucky-games/contracts';

export type ReelsAnimationCue =
  'winLine' | 'anticipationStart' | 'anticipationEnd' | 'cascadeFall' | 'cascadeLand';

export type GameEvents = {
  'ui:spinRequested': void;
  'ui:maxBetInsufficientBalance': void;
  'ui:quickStopRequested': void;
  'ui:skipWinRequested': void;
  'reels:cue': ReelsAnimationCue;
  'reel:stopped': number;
  'spin:landed': RoundResult;
  'round:completed': RoundResult;
};
