import {
  roundResultSchema,
  slotMessageSchema,
  slotStateSchema,
  type RoundResult,
  type SlotMessage,
  type SlotState,
} from '@lucky-games/contracts';
import { SlotContractError } from './SlotApiError';

export function parseSlotState(value: unknown, expectedSessionId?: string): SlotState {
  const parsed = slotStateSchema.safeParse(value);
  if (!parsed.success) throw new SlotContractError('game state', parsed.error);
  if (expectedSessionId && parsed.data.sessionId !== expectedSessionId) {
    throw new SlotContractError('session ID in game state');
  }
  return parsed.data;
}

export function parseRoundResult(value: unknown, expectedRequestId: string): RoundResult {
  const parsed = roundResultSchema.safeParse(value);
  if (!parsed.success) throw new SlotContractError('round result', parsed.error);
  if (parsed.data.requestId !== expectedRequestId) {
    throw new SlotContractError('request ID in round result');
  }
  return parsed.data;
}

export function parseSlotMessage(value: unknown, expectedRequestId: string): SlotMessage | null {
  if (
    value !== null &&
    typeof value === 'object' &&
    'requestId' in value &&
    typeof value.requestId === 'string' &&
    value.requestId !== expectedRequestId
  ) {
    return null;
  }

  const parsed = slotMessageSchema.safeParse(value);
  if (!parsed.success) throw new SlotContractError('WebSocket message', parsed.error);
  if (parsed.data.type === 'ROUND_RESULT' && parsed.data.result.requestId !== expectedRequestId) {
    throw new SlotContractError('request ID in WebSocket round result');
  }
  return parsed.data;
}
