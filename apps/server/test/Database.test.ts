import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { SlotService } from '../src/game/SlotService.js';
import { Database } from '../src/storage/Database.js';

const databases: Database[] = [];
const directories: string[] = [];

function openDatabase(path: string): Database {
  const database = new Database(path);
  databases.push(database);
  return database;
}

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe('SQLite round storage', () => {
  it('restores a session and its round after reopening the database file', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'egypt-slot-db-'));
    directories.push(directory);
    const path = join(directory, 'data', 'game.sqlite');
    const database = openDatabase(path);
    await database.initialize();
    const session = await database.createSession();
    const command = {
      type: 'SPIN' as const,
      sessionId: session.id,
      requestId: 'saved_round',
      bet: 15,
      level: 1,
    };
    const first = await new SlotService(database, () => 2).play(command);
    await database.close();
    databases.splice(databases.indexOf(database), 1);

    const reopened = openDatabase(path);
    await reopened.initialize();
    const restored = await reopened.getSession(session.id);
    const savedRound = await reopened.getRound(session.id, command.requestId);
    const repeated = await new SlotService(reopened, () => 0).play(command);

    expect(restored?.balance_coins).toBe(first.balance.afterWin);
    expect(savedRound).toEqual(first);
    expect(repeated).toEqual(first);
    expect((await reopened.getSession(session.id))?.balance_coins).toBe(first.balance.afterWin);
  });

  it('rejects reuse of a request ID for a different action', async () => {
    const database = openDatabase(':memory:');
    await database.initialize();
    const session = await database.createSession();
    const command = {
      type: 'SPIN' as const,
      sessionId: session.id,
      requestId: 'same_id',
      bet: 15,
      level: 1,
    };
    const first = await new SlotService(database, () => 2).play(command);

    await expect(
      database.executeRound(session.id, command.requestId, 'FREE_SPIN', () => {
        throw new Error('Calculator should not run');
      }),
    ).rejects.toMatchObject({ code: 'REQUEST_ID_CONFLICT' });
    expect((await database.getSession(session.id))?.balance_coins).toBe(first.balance.afterWin);
  });

  it('rolls back a failed calculation and leaves the request ID available', async () => {
    const database = openDatabase(':memory:');
    await database.initialize();
    const session = await database.createSession();

    await expect(
      database.executeRound(session.id, 'failed_round', 'SPIN', () => {
        throw new Error('Calculation failed');
      }),
    ).rejects.toThrow('Calculation failed');
    expect((await database.getSession(session.id))?.balance_coins).toBe(250000);
    expect(await database.getRound(session.id, 'failed_round')).toBeNull();
  });
});
