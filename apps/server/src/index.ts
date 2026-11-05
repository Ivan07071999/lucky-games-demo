import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { Database } from './storage/Database.js';
import { SlotService } from './game/SlotService.js';
import { createServer } from './http/createServer.js';

if (existsSync(new URL('../.env', import.meta.url)))
  loadEnvFile(new URL('../.env', import.meta.url));

const serverDirectory = fileURLToPath(new URL('../', import.meta.url));
const databasePath = resolve(serverDirectory, process.env.SQLITE_DB_PATH ?? 'data/game.sqlite');
const port = Number(process.env.PORT ?? 3001);
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ?? 'http://localhost:5400,http://127.0.0.1:5400'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const database = new Database(databasePath);
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
