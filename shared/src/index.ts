// shared/src/index.ts
export { env } from "./config/env";

export {
  generatePairingToken,
  consumePairingToken,
  isPairingOpen,
  purgePairingTokens,
  PAIRING_TTL_SECONDS,
} from "./pairing";

export {
  createDevice,
  verifyDeviceToken,
  revokeDevice,
  listDevices,
} from "./devices";

export type { Device, PairingResult, QrPlayload, Token } from "./types";