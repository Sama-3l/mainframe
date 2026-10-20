import { z } from "zod";
import dotenv from 'dotenv';
import path, { resolve } from 'node:path';

dotenv.config({
  path: resolve(process.cwd(), '../.env'),
});

const envSchema = z.object({
    DB_PATH: z.string().default(""),
    GALLERY_PATH: z.string().default("")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;