export const PhaseName = {
  init: 'init',
  loading: 'loading',
  idle: 'idle',
  spinning: 'spinning',
  freeSpins: 'freeSpins',
  freeSpinsIntro: 'freeSpinsIntro',
  freeSpinsOutro: 'freeSpinsOutro',
  result: 'result',
} as const;

export type PhaseName = (typeof PhaseName)[keyof typeof PhaseName];

export const phaseTransitions = {
  [PhaseName.init]: [PhaseName.loading],
  [PhaseName.loading]: [PhaseName.idle, PhaseName.freeSpins],
  [PhaseName.idle]: [PhaseName.spinning, PhaseName.freeSpins],
  [PhaseName.spinning]: [PhaseName.result, PhaseName.idle],
  [PhaseName.freeSpins]: [PhaseName.result, PhaseName.idle],
  [PhaseName.freeSpinsIntro]: [PhaseName.freeSpins],
  [PhaseName.freeSpinsOutro]: [PhaseName.idle],
  [PhaseName.result]: [
    PhaseName.idle,
    PhaseName.freeSpins,
    PhaseName.freeSpinsIntro,
    PhaseName.freeSpinsOutro,
  ],
} as const satisfies Record<PhaseName, readonly PhaseName[]>;

export type NextPhase<Name extends PhaseName> = (typeof phaseTransitions)[Name][number];
