import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> } // Next 14: { params: { filename: string } }
) {
    const { filename } = await params;
    const safeName = path.basename(filename); // blocks ../ path traversal

    try {

      const file = await unlink(path.join("/home/samael", "uploads", safeName));
      
      return NextResponse.json(
        {   
            success: true,
            message : "Successfully Deleted",
            data: {
                fileName: safeName
            }
        }, 
        { status : 200 });
    } catch {
      return new NextResponse("Not found", { status: 404 });
    }
}