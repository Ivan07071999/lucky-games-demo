import type { RoundResult } from '@lucky-games/contracts';

export type ReelsAnimationCue =
  'winLine' | 'anticipationStart' | 'anticipationEnd' | 'cascadeFall' | 'cascadeLand';

export type GameEvents = {
  'ui:spinRequested': void;
  'ui:maxBetInsufficientBalance': void;
  'ui:quickStopRequested': void;
  'ui:skipWinRequested': void;
  'ui:betChanged': void;
  'reels:cue': ReelsAnimationCue;
  'reel:stopped': number;
  'round:completed': RoundResult;
};
