import { withAuth } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";
import { unpair } from "../../../../../../shared/src/pairing";

export const POST = withAuth(async (req: NextRequest) => {
  const deviceId = req.nextUrl.searchParams.get("deviceId");

  if (!deviceId) {
    return NextResponse.json(
      { success: false, message: "deviceId is required" },
      { status: 400 }
    );
  }

  try {
    unpair(deviceId);
    return NextResponse.json(
      { success: true, message: "Unpair done" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Unpair failed" },
      { status: 404 }
    );
  }
});