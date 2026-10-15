import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function hasValidSignature(
  buffer: Buffer,
  mimeType: string
): boolean {
  if (mimeType === "image/jpeg") {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    );
  }

  if (mimeType === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Image is required." },
        { status: 400 }
      );
    }

    const extension = ALLOWED_TYPES[file.type];

    if (!extension) {
      return NextResponse.json(
        { success: false, message: "Only JPEG, PNG, and WebP images are allowed." },
        { status: 415 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "Image must be between 1 byte and 5 MB." },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!hasValidSignature(buffer, file.type)) {
      return NextResponse.json(
        { success: false, message: "Invalid image file." },
        { status: 415 }
      );
    }

    const filename = `${randomUUID()}.${extension}`;
    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads"
    );

    await mkdir(uploadDirectory, { recursive: true });

    await writeFile(
      path.join(uploadDirectory, filename),
      buffer,
      { flag: "wx" }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Image uploaded successfully.",
        data: {
          filename,
          url: `/uploads/${filename}`,
          size: buffer.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Image upload failed:", error);

    return NextResponse.json(
      { success: false, message: "Image upload failed." },
      { status: 500 }
    );
  }
}