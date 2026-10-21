import { getDb } from "./db";
import { isPairingOpen } from "./pairing";
import { generateDeviceId, generateToken, safeEquals, sha256 } from "./token";
import { Device, PairingResult } from "./types";

export function createDevice(device: Device, now: number) : PairingResult | null {
    const db = getDb();
    return db.transaction(() : PairingResult | null => {
        if(!isPairingOpen()) throw new Error("Device Creation Issue")

        const deviceId = generateDeviceId();
        const secret = generateToken();

        db.prepare(
            "INSERT INTO devices (id, name, platform, token_hash, created_at) VALUES (?, ?, ?, ?, ?)"
        ).run(deviceId, device.name, device.platform, sha256(secret), now);

        return {
        deviceId : deviceId,
        deviceToken: `${deviceId}.${secret}`,
    }}).immediate();
}

export function verifyDeviceToken(id: string, token: string) : boolean {
    const db = getDb();

    return db.transaction(() : boolean => {
        const device = db.prepare(`
            SELECT token_hash
            FROM devices
            WHERE id = ?
            AND revoked_at IS NULL
        `).get(id) as { token_hash: string } | undefined;

        if (!device) {
            return false;
        }
        
        return safeEquals(sha256(token), device.token_hash);
    }).immediate();
}

export function listDevices() : Device[] {
    const db = getDb();
    
    const devices = db.prepare(`
        SELECT name, platform, token_hash
        FROM devices
        WHERE revoked_at IS NULL
        ORDER BY created_at DESC
    `).all() as Device[];

    return devices;
}

export function revokeDevice(id: string) {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000)

    return db.transaction(() => {
        const res = db.prepare(
            "UPDATE devices SET revoked_at = ?" + " WHERE id = ? AND revoked_at IS NULL"
        ).run(now, id);

        if (res.changes !== 1) return null;

        return {
            success : true,
            message: "Revoke Successful"
        }
    });
}