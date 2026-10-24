import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth"; // adjust to your actual path

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  // keep whatever you already have
};

type Ctx = { params: Promise<{ filename: string }> }; // Next 14: { params: { filename: string } }

export const GET = withAuth<Ctx>(async (_req: NextRequest, { params }) => {
  const { filename } = await params; // Next 14: const { filename } = params;
  const safeName = path.basename(filename); // blocks ../ path traversal
  const contentType = MIME[path.extname(safeName).slice(1).toLowerCase()];

  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const file = await readFile(path.join("/home/samael", "uploads", safeName));

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
});