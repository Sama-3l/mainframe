import { createApp } from "../app/app";
import { getTunnelUrl } from "../modules/pair/getURL";
import { env } from "../config/env";
import { generatePairingToken, isPairingOpen, listDevices, QrPlayload } from "../../../shared/src";
import QRCode from "qrcode";

const PORT = 4000;
const app = createApp();

let ready = false;                       // true once startup finished
let startupError: string | null = null;  // set if startup fails
let pairingOpen: Boolean = false;
let QRCodeData: string | null = null;
let devices = "";

// Device names come from the app, so escape them before putting them in HTML.
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const page = (title: string, body: string) =>
  `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" />
   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
   <title>Mainframe - ${title}</title></head><body>${body}</body></html>`;

app.get("/", (_req, res) => {
  // 1. Startup failed: show why instead of spinning forever
  if (startupError) {
    return res.status(500).send(page("Error", `<h2>Setup failed</h2><pre>${esc(startupError)}</pre>`));
  }
  // 2. Still waiting for the tunnel URL / token / DB
  if (!ready) {
    return res.status(503).send(page("Initializing",
      `<h2>Initializing Theo...</h2><p>Waiting for the Cloudflare Tunnel to become available.</p>`));
  }
  // 3. Already paired: show devices (this was unreachable before)
  if (!pairingOpen) {
    return res.send(page("Paired",
      `<h2>Pairing Closed</h2><p>Unpair from the app to pair again.</p>${devices}`));
  }
  // 4. Pairing open: show QR
  res.send(page("Pair Device", `
    <main>
      <h1>Mainframe</h1>
      <p>● Tunnel active</p>
      <img src="${QRCodeData}" alt="Theo pairing QR code" />
      <p>Scan this QR code using your Flutter application.</p>
    </main>`));
});

// Express listens on all interfaces by default, which Docker port-mapping needs.
app.listen(PORT, async () => {
  console.log(`Mainframe setup running on port ${PORT}`);

  try {
    pairingOpen = await isPairingOpen(); // await is harmless if it's sync

    const deviceList = await listDevices();
    devices = `<ul>${deviceList.map((d) => `<li>${esc(d.name)} | ${esc(d.platform ?? "")}</li>`).join("")}</ul>`;

    // Only mint a token when pairing is actually open, so closed state leaves no stale tokens.
    if (pairingOpen) {
      const tunnelURL = `${await getTunnelUrl(env.TUNNEL_METRICS_URL)}/api/v1`;
      const pairingToken = await generatePairingToken();

      const payload: QrPlayload = {
        url: tunnelURL,
        token: pairingToken.token,
        serverId: pairingToken.serverId ?? "",
      };

      QRCodeData = await QRCode.toDataURL(JSON.stringify(payload), {
        width: 400, margin: 2, errorCorrectionLevel: "M",
      });
    }

    ready = true;

    // Skipped in Docker (OPEN_BROWSER=false); `open` is imported lazily so it never loads there.
    if (process.env.OPEN_BROWSER !== "false") {
      const { default: open } = await import("open");
      await open(`http://localhost:${PORT}/`).catch(() => {});
      console.log("Theo pairing page opened in your browser.");
    } else {
      console.log(`Pairing page ready: http://localhost:${PORT}/`);
    }
  } catch (e) {
    startupError = e instanceof Error ? e.message : String(e);
    console.error("Setup startup failed:", e);
  }
});