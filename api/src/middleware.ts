// api/src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/api/v1/pair") return NextResponse.next();

  console.log(req.headers.get("authorization"));

  if (!req.headers.get("authorization")?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 404 });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/api/v1/((?!pair$|health$).*)"] };