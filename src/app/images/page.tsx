
"use client";

import React, { useEffect, useState } from "react";

type ImageItem = {
  filename: string;
  mimeType: string;
  data: string;
};

type ImagesResponse = {
  data: ImageItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export default function Images() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchImages() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/v1/images?page=${page}&limit=10`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch images");
        }

        const result: ImagesResponse = await response.json();

        setImages(result.data);
        setTotalPages(result.pagination.totalPages);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchImages();

    return () => controller.abort();
  }, [page]);

  return (
    <div className="space-y-6">
      {loading && <p>Loading images...</p>}

      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && images.length === 0 && (
        <p>No images found.</p>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {images.map((image) => (
          <div key={image.filename}>
            <img
              src={`data:${image.mimeType};base64,${image.data}`}
              alt={image.filename}
              className="w-full rounded-lg"
            />
            <p className="mt-1 truncate text-sm">
              {image.filename}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => p - 1)}
          className="rounded border px-4 py-2 disabled:opacity-40"
        >
          Previous
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page >= totalPages || loading}
          onClick={() => setPage((p) => p + 1)}
          className="rounded border px-4 py-2 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
