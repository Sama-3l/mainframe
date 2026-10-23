// shared/src/types.ts
import { z } from "zod";

export const PairRequestSchema = z.object({
  pairingToken: z.string().min(20).max(128),
  name: z.string().trim().min(1).max(64),
  platform: z.enum(["android", "ios"]).nullable(),
});

export type PairRequest = z.infer<typeof PairRequestSchema>;    