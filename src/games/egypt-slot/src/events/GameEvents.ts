import type { RoundResult } from '@lucky-games/contracts';

export type GameEvents = {
  'ui:spinRequested': void;
  'spin:started': void;
  'spin:landed': RoundResult;
  'round:completed': RoundResult;
};
