import path from "path";
import { env } from "@/config/env";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  allowedDevOrigins: env?.ALLOWED_URLS,
  cacheComponents: true,
  partialPrefetching: true,

  // Compile the TypeScript code in the shared folder
  transpilePackages: ["shared"], // must match the "name" in shared/package.json

  turbopack: {
    // Let Turbopack resolve files outside the app folder (the monorepo root)
    root: path.join(__dirname, ".."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;