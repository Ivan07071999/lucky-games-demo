import { SLOT_ERROR_CODES, type SlotErrorCode } from '@lucky-games/contracts';

export class SlotApiError extends Error {
  readonly code: SlotErrorCode | null;

  constructor(message: string, code: SlotErrorCode | null = null) {
    super(message);
    this.name = 'SlotApiError';
    this.code = code;
  }
}

export class SlotContractError extends Error {
  constructor() {
    super('The slot server returned an incompatible game state');
    this.name = 'SlotContractError';
  }
}

export function isSlotErrorCode(value: unknown): value is SlotErrorCode {
  return typeof value === 'string' && SLOT_ERROR_CODES.some((code) => code === value);
}
