import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "MainFrame backend is running.",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}