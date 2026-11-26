import * as SQLite from 'expo-sqlite';
import { MIGRATIONS, SCHEMA_VERSION } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('hasabxesib.db');
    runMigrations(db);
  }
  return db;
}

function runMigrations(database: SQLite.SQLiteDatabase) {
  database.execSync('PRAGMA journal_mode = WAL;');
  database.execSync('CREATE TABLE IF NOT EXISTS schema_meta (version INTEGER NOT NULL);');
  const row = database.getFirstSync<{ version: number }>('SELECT version FROM schema_meta LIMIT 1;');
  const current = row?.version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    database.withTransactionSync(() => {
      database.execSync(MIGRATIONS[v]);
      if (v === current && !row) {
        database.runSync('INSERT INTO schema_meta (version) VALUES (?)', [v + 1]);
      } else {
        database.runSync('UPDATE schema_meta SET version = ?', [v + 1]);
      }
    });
  }
  if (current > SCHEMA_VERSION) {
    throw new Error(`Database schema version ${current} is newer than app supports (${SCHEMA_VERSION})`);
  }
}
