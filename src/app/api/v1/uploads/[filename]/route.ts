import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> } // Next 14: { params: { filename: string } }
) {
  const { filename } = await params;
  const safeName = path.basename(filename); // blocks ../ path traversal
  const contentType = MIME[path.extname(safeName).slice(1).toLowerCase()];

  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const file = await readFile(path.join(process.cwd(), "uploads", safeName));

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}