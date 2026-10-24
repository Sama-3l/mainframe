import { NextRequest, NextResponse } from "next/server";
import { verifyDeviceToken } from "../../../shared/src/devices";

const unauthorized = () =>
  NextResponse.json(
    { success: false, error: "unauthorized", message: "You are not authorized for this call" },
    { status: 401 }
  );

export function withAuth<C>(
  handler: (req: NextRequest, ctx: C) => Promise<Response>
) {
  return async (req: NextRequest, ctx: C) => {
    const [scheme, token] = (req.headers.get("authorization") ?? "").split(" ");
    if (scheme !== "Bearer" || !token) return unauthorized();

    const [deviceId, deviceToken] = token.split(".");
    if (!deviceId || !deviceToken) return unauthorized();

    const device = verifyDeviceToken(deviceId, deviceToken);
    if (!device) return unauthorized();

    return handler(req, ctx);
  };
}