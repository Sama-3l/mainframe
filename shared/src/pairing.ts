import { getDb } from "./db";
import { createDevice, revokeDevice } from "./devices";
import { generateToken, sha256 } from "./token";
import { Device, PairingResult } from "./types";

interface TokenRow {
  expires_at: number;
  used_at: number;
  created_at: number;
  // add other columns if you use them
}

export const PAIRING_TTL_SECONDS = 120;
const nowSec = () => Math.floor(Date.now() / 1000);

export function isPairingOpen(): Boolean {    
    const setting = getDb()
        .prepare("SELECT value FROM server_settings WHERE key = 'pairing_open'")
        .get() as { value : string } | undefined;
    return setting?.value === "1" || setting?.value === undefined;
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
        
        const serverId = (db.prepare(
            "SELECT value FROM server_settings WHERE key = 'server_id'"
        ).get() as { value : string } | undefined)?.value;

        db.prepare("UPDATE server_settings SET value = '1' WHERE key = 'pairing_open'").run();
        
        return { token: token, expiresAt: expiresAt, serverId: serverId };
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
        db.prepare(`
            INSERT INTO server_settings (key, value)
            VALUES ('pairing_open', '0')
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `).run();
        return creds;
    }).immediate();
}

export function checkPairingTokens(){
    const db = getDb();
    const res = db.prepare("SELECT * FROM tokens").all() as TokenRow[];
    console.log(res)
    for (const row of res) {
        const { expires_at, used_at, created_at } = row;
        const expire = new Date(expires_at * 1000)
        const used = new Date(used_at * 1000)
        const create = new Date(created_at * 1000)

        console.log(expire)
        console.log(used)
        console.log(create)
    }
}

export function unpair(id: string){
    const db = getDb();
    db.prepare("UPDATE server_settings SET value = '1' WHERE key = 'pairing_open'").run();
    revokeDevice(id);
}

export function pairingSettings(){
    const db = getDb();
    const res = db.prepare("SELECT * FROM server_settings").all();

    console.log(res)
}

export function purgePairingTokens(now = nowSec()) {
  getDb().prepare("DELETE FROM tokens WHERE expires_at < ?").run(now - 3600);
}