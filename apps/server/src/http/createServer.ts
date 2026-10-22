import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { z } from 'zod';
import type { SlotCommand, SlotMessage } from '@lucky-games/contracts';
import { SlotService } from '../game/SlotService.js';
import { SlotError } from '../storage/Database.js';

const requestId = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/);
const sessionId = z.string().uuid();
const commandSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('SPIN'),
    sessionId,
    requestId,
    bet: z.number().int(),
    level: z.number().int(),
    coinValue: z.number(),
  }),
  z.strictObject({ type: z.literal('FREE_SPIN'), sessionId, requestId }),
]);

export async function createServer(service: SlotService, allowedOrigins: string[]) {
  const server = Fastify({ logger: true, bodyLimit: 4096 });
  await server.register(websocket, { options: { maxPayload: 4096 } });

  server.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin;
    if (!origin || !allowedOrigins.includes(origin)) return;
    reply.header('Access-Control-Allow-Origin', origin);
    reply.header('Vary', 'Origin');
    reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  });
  server.options('/api/slot/*', async (_request, reply) => reply.code(204).send());

  server.post('/api/slot/session', async () => service.createSession());

  server.get('/api/slot/state', async (request, reply) => {
    const id = getSessionId(request.headers.authorization);
    if (!id)
      return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Bearer session ID required' });
    try {
      return await service.getState(id);
    } catch (error) {
      return sendError(reply, error);
    }
  });

  server.get<{ Params: { requestId: string } }>(
    '/api/slot/rounds/:requestId',
    async (request, reply) => {
      const id = getSessionId(request.headers.authorization);
      if (!id)
        return reply
          .code(401)
          .send({ code: 'UNAUTHORIZED', message: 'Bearer session ID required' });
      if (!requestId.safeParse(request.params.requestId).success) {
        return reply.code(400).send({ code: 'INVALID_REQUEST', message: 'Invalid requestId' });
      }
      try {
        return await service.getRound(id, request.params.requestId);
      } catch (error) {
        return sendError(reply, error);
      }
    },
  );

  server.get('/api/slot/ws', { websocket: true }, (socket, request) => {
    const origin = request.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
      socket.close(1008, 'Origin not allowed');
      return;
    }
    let busy = false;
    socket.on('message', async (raw: { toString(): string }) => {
      if (busy) {
        send(socket, {
          type: 'ERROR',
          requestId: null,
          code: 'SPIN_IN_PROGRESS',
          message: 'Wait for the current round',
        });
        return;
      }
      busy = true;
      let id: string | null = null;
      try {
        const parsed = commandSchema.safeParse(JSON.parse(raw.toString()));
        if (!parsed.success) throw new SlotError('INVALID_REQUEST', 'Invalid game command');
        const command: SlotCommand = parsed.data;
        id = command.requestId;
        const result = await service.play(command);
        send(socket, { type: 'ROUND_RESULT', requestId: id, result });
      } catch (error) {
        const slotError =
          error instanceof SlotError
            ? error
            : error instanceof SyntaxError
              ? new SlotError('INVALID_REQUEST', 'Invalid game command')
              : new SlotError('INTERNAL_ERROR', 'Game command failed');
        if (!(error instanceof SlotError) && !(error instanceof SyntaxError))
          server.log.error(error);
        send(socket, {
          type: 'ERROR',
          requestId: id,
          code: slotError.code,
          message: slotError.message,
        });
      } finally {
        busy = false;
      }
    });
  });

  return server;
}

function getSessionId(authorization?: string): string | null {
  const match = /^Bearer ([\w-]+)$/i.exec(authorization ?? '');
  return match && sessionId.safeParse(match[1]).success ? match[1] : null;
}

function send(
  socket: { send(data: string): void; readyState: number },
  message: SlotMessage,
): void {
  if (socket.readyState === 1) socket.send(JSON.stringify(message));
}

function sendError(
  reply: { code(status: number): { send(data: unknown): unknown } },
  error: unknown,
) {
  if (error instanceof SlotError) {
    const status = error.code.endsWith('NOT_FOUND') ? 404 : 400;
    return reply.code(status).send({ code: error.code, message: error.message });
  }
  throw error;
}
