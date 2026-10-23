import { NextRequest, NextResponse } from "next/server";
import { Device } from "../../../shared/src/types";
import { verifyDeviceToken } from "../../../shared/src/devices";

type Ctx = { params: Promise<Record<string, string>> };

const unauthorized = () =>
  NextResponse.json({ success: false, error: "unauthorized", message: "You are not authorized for this call" }, { status: 401 });

export function withAuth(
  handler: (req: NextRequest, ctx: Ctx) => Promise<Response>
) { 
    return async (req: NextRequest, ctx: Ctx) => {
        const [scheme, token] = (req.headers.get("authorization") ?? "").split(" ");
        if (scheme !== "Bearer" || !token) return unauthorized();
        const [deviceId, deviceToken] = token.split(".");

        const device = verifyDeviceToken(deviceId, deviceToken); 
        if (!device) return unauthorized();

        return handler(req, ctx);
    }
}