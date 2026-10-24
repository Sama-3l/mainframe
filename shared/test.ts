import { listDevices } from './src'
import { checkPairingTokens, isPairingOpen, pairingSettings } from './src/pairing';

const res = listDevices();
// checkPairingTokens();
pairingSettings();
console.log(res);