CREATE TABLE IF NOT EXISTS server_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id           TEXT    PRIMARY KEY,     -- random id, the lookup half of the device token
  name         TEXT    NOT NULL,
  platform     TEXT,
  token_hash   TEXT    NOT NULL,        -- SHA-256 of the secret half
  created_at   INTEGER NOT NULL,
  last_seen_at INTEGER,
  revoked_at   INTEGER                  -- NULL = active
);

CREATE INDEX IF NOT EXISTS pairing_tokens_expires ON pairing_tokens (expires_at);

CREATE TABLE IF NOT EXISTS tokens(
    id INTEGER PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    used_at    INTEGER,                   -- NULL = still usable
    created_at INTEGER NOT NULL
);