import { getDb } from "./db";
import { createDevice } from "./devices";
import { generateToken, sha256 } from "./token";
import { Device, PairingResult } from "./types";

export const PAIRING_TTL_SECONDS = 120;
const nowSec = () => Math.floor(Date.now() / 1000);

export function isPairingOpen(): Boolean {
    const setting = getDb()
        .prepare("SELECT value FROM settings WHERE key = 'pairing_open'")
        .get() as { value : string } | undefined;
    return setting?.value === "1";
}

export function generatePairingToken(now = nowSec()) {
    const db = getDb();
    return db.transaction(() => {
        if (!isPairingOpen()) throw new Error("pairing is closed");

        const { changes } = db.prepare("DELETE FROM tokens WHERE used_at IS NULL").run();

        const token = generateToken();
        const expiresAt = now + PAIRING_TTL_SECONDS;
        db.prepare(
            "INSERT INTO tokens (token_hash, expires_at, created_at) VALUES (?, ?, ?)"
        ).run(sha256(token), expiresAt, now);

        return { token: token, expiresAt: expiresAt };
    }).immediate();
}

export function consumePairingToken(rawToken: string, device: Device, now = nowSec()): PairingResult | null {
    if (typeof rawToken !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(rawToken)) return null;
    const name = typeof device.name === "string" ? device.name.trim().slice(0, 64) : "";
    if(!name) return null;
    const platform = device.platform === "android" || device.platform === "ios"
        ? device.platform : null;

    const db = getDb();
    return db.transaction((): PairingResult | null =>{
        if(!isPairingOpen()) throw new Error("pairing is closed");

        const res = db.prepare(
            "UPDATE tokens SET used_at = ? " +
            "WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?"
        )
        .run(now, sha256(rawToken), now);
        if (res.changes !== 1) return null;

        const creds = createDevice({ platform: platform, name: name }, now);
        db.prepare("UPDATE settings SET value = '0' WHERE key = 'pairing_open'").run();
        return creds;
    }).immediate();
}

export function purgePairingTokens(now = nowSec()) {
  getDb().prepare("DELETE FROM tokens WHERE expires_at < ?").run(now - 3600);
}