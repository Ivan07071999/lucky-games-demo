export const PhaseName = {
  init: 'init',
  loading: 'loading',
  idle: 'idle',
} as const;

export type PhaseName = (typeof PhaseName)[keyof typeof PhaseName];

export const phaseTransitions = {
  [PhaseName.init]: [PhaseName.loading],
  [PhaseName.loading]: [PhaseName.idle],
  [PhaseName.idle]: [],
} as const satisfies Record<PhaseName, readonly PhaseName[]>;

export type NextPhase<Name extends PhaseName> = (typeof phaseTransitions)[Name][number];
