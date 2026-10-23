import type { RoundResult } from '@lucky-games/contracts';

export type GameEvents = {
  'ui:spinRequested': void;
  'ui:maxBetInsufficientBalance': void;
  'ui:quickStopRequested': void;
  'ui:skipWinRequested': void;
  'spin:started': void;
  'spin:landed': RoundResult;
  'round:completed': RoundResult;
};
