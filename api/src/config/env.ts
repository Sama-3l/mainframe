import { z } from "zod";

const envSchema = z.object({
  ALLOWED_URLS: z
    .string()
    .default("")
    .transform((value) =>
      value.split(",").map((url) => url.trim()).filter(Boolean)
    ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;