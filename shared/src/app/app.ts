import Database from 'better-sqlite3';
import { env } from '../config/env'
import path, { resolve } from 'node:path';
import { existsSync } from 'node:fs';

console.log(path.join(env.DB_PATH, 'app.db'));

const dbPath = resolve(process.cwd(), 'app.db');

if (existsSync(dbPath)) {
  console.log('Database exists');
} else {
  console.log('Database does not exist');
}

export function initializeDatabase() {
    const db = new Database(path.join(env.DB_PATH, 'app.db'));

    const query = `
        CREATE TABLE tokens(
            id INTEGER PRIMARY KEY,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at INTEGER NOT NULL,
            used_at    INTEGER,                   -- NULL = still usable
            created_at INTEGER NOT NULL
        )
    `;

    const table = db.prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = tokens
    `)

    console.log(table)
} 