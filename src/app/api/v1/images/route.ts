
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const IMAGE_DIRECTORY = "/home/samael/uploads";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") ?? "1", 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(
        1,
        Number.parseInt(searchParams.get("limit") ?? "10", 10) || 10
      )
    );

    const entries = await readdir(IMAGE_DIRECTORY, {
      withFileTypes: true,
    });

    // const pngFiles = entries
    //   .filter(
    //     (entry) =>
    //       entry.isFile() &&
    //       entry.name.toLowerCase().endsWith(".png")
    //   )
    //   .map((entry) => entry.name)
    //   .sort((a, b) => a.localeCompare(b));
      

    // const total = pngFiles.length;
    // const start = (page - 1) * limit;
    // const selectedFiles = pngFiles.slice(start, start + limit);

    // const images = await Promise.all(
    //   selectedFiles.map(async (filename) => {
    //     const filePath = path.join(IMAGE_DIRECTORY, filename);
    //     const buffer = await readFile(filePath);

    //     return {
    //       filename,
    //       mimeType: "image/png",
    //       data: buffer.toString("base64"),
    //     };
    //   })
    // );

    const images = entries
      .filter(
        (entry) =>
          entry.isFile() &&
          [".png", ".jpg", ".jpeg", ".webp"].includes(
            path.extname(entry.name).toLowerCase()
          )
      )
      .map((entry) => ({
        name: entry.name,
        fileType: path.extname(entry.name).toLowerCase().slice(1),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const total = images.length;
    const start = (page - 1) * limit;
    const selectedFiles = images.slice(start, start + limit);

    const selectedImages = await Promise.all(
      selectedFiles.map(async (file) => {
        const filePath = path.join(IMAGE_DIRECTORY, file.name);
        const buffer = await readFile(filePath);
        
        return {
          file,
          mimeType: file.fileType,
          data: buffer.toString("base64"),
        };
      })
    );

    return Response.json({
      success: true,
      message: "Successful Operation",
      data: selectedImages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: start + selectedFiles.length < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Failed to fetch images:", error);

    return Response.json(
      { success: false,
      message: "Failed to fetch images", error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
