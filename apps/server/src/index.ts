import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { Database } from './storage/Database.js';
import { SlotService } from './game/SlotService.js';
import { createServer } from './http/createServer.js';

if (existsSync(new URL('../.env', import.meta.url)))
  loadEnvFile(new URL('../.env', import.meta.url));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');
const port = Number(process.env.PORT ?? 3001);
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const database = new Database(connectionString);
await database.initialize();
const server = await createServer(new SlotService(database), allowedOrigins);

const shutdown = async () => {
  await server.close();
  await database.close();
};
process.once('SIGINT', () => {
  void shutdown();
});
process.once('SIGTERM', () => {
  void shutdown();
});
await server.listen({ host: '127.0.0.1', port });
