export const PhaseName = {
  init: 'init',
  loading: 'loading',
  idle: 'idle',
  spinning: 'spinning',
  result: 'result',
} as const;

export type PhaseName = (typeof PhaseName)[keyof typeof PhaseName];

export const phaseTransitions = {
  [PhaseName.init]: [PhaseName.loading],
  [PhaseName.loading]: [PhaseName.idle],
  [PhaseName.idle]: [PhaseName.spinning],
  [PhaseName.spinning]: [PhaseName.result, PhaseName.idle],
  [PhaseName.result]: [PhaseName.idle],
} as const satisfies Record<PhaseName, readonly PhaseName[]>;

export type NextPhase<Name extends PhaseName> = (typeof phaseTransitions)[Name][number];
