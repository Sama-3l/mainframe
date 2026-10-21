import Database from "better-sqlite3";
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import path, { dirname } from "node:path";
import { env } from "../config/env";
import { fileURLToPath } from "node:url";

const schemaPath = fileURLToPath(
  new URL(".././schema.sql", import.meta.url)
);

const SCHEMA_V1 = readFileSync(schemaPath, "utf8");

// CHECK FOR EXISTING CACHED DATABASE CONNECTION
const g = globalThis as unknown as { __db?: Database.Database }         

export function getDb(): Database.Database {
    if (g.__db) return g.__db;

    // This creates the app.db at the specified place and any folders that are not present
    mkdirSync(dirname(path.join(env.DB_PATH, 'app.db')), { recursive:  true });
    const conn = new Database(path.join(env.DB_PATH, 'app.db'));

    conn.pragma("journal_mode = WAL");   // persists in the file
    conn.pragma("synchronous = NORMAL"); // the usual pairing with WAL
    conn.pragma("busy_timeout = 5000");  // per connection: wait instead of erroring
    conn.pragma("foreign_keys = ON");    // per connection

    migrate(conn);
    g.__db = conn;
    return conn;    
}

function migrate(conn: Database.Database) {
  conn.transaction(() => {
    conn.exec(SCHEMA_V1); // idempotent
    conn
      .prepare("INSERT OR IGNORE INTO server_settings (key, value) VALUES ('server_id', ?)")
      .run(randomBytes(16).toString("hex"));
  }).immediate(); // take the write lock up front
}