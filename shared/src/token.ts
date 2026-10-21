import { randomBytes, createHash, timingSafeEqual,  } from "node:crypto";

export const token = randomBytes(16).toString("hex");

export function generatePairingToken(bytes = 32) : string{
    return randomBytes(bytes).toString("base64url");
}

export function generateDeviceId(bytes = 16) : string{
    return randomBytes(bytes).toString("hex");
}

export function sha256(input: string) : string{
    return createHash("sha256").update(input).digest("hex")
}

export function safeEquals(a: string, b: string) : boolean {
    const ab = Buffer.from(a)
    const bb = Buffer.from(b)
    if(ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
}