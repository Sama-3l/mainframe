import { withAuth } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";
import { unpair } from "../../../../../../shared/src/pairing";

type Ctx = { params: Promise<{ deviceId: string }> }; // Next 14: { params: { filename: string } }

export const POST = withAuth<Ctx>(async (_req: NextRequest, { params }) => {
  const deviceId  = _req.nextUrl.searchParams.get("deviceId")

  try {
    if(deviceId){
      unpair(deviceId)

      return NextResponse.json(
          {
              success: true,
              message: "Unpair done"
          },
          { status: 200 }
      );
    }else{
      return new NextResponse("Not found", { status: 404 });
    }
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
});