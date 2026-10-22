import { createApp } from "../app/app";
import { getTunnelUrl } from "../modules/pair/getURL";
import { env } from "../config/env"
import { generatePairingToken, isPairingOpen, QrPlayload } from "../../../shared/src";
import QRCode from "qrcode";
import open from "open";

const PORT = 4000;

const app = createApp();
let error : string  | null;
let QRCodeData : string | null;

app.get("/", (_req, res) => {
  if (!QRCodeData) {
    return res.status(503).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mainframe - Initializing</title>
        </head>
        <body>
          <h2>Initializing Theo...</h2>
          <p>Waiting for the Cloudflare Tunnel to become available.</p>
        </body>
      </html>
    `);
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Mainframe - Pair Device</title>
      </head>
      <body>
        <main>
          <h1>Mainframe</h1>
          <p class="status">● Tunnel active</p>

          <img
            src="${QRCodeData}"
            alt="Theo pairing QR code"
          />

          <p>Scan this QR code using your Flutter application.</p>
        </main>
      </body>
    </html>
  `)
})

const server = app.listen(PORT, async () => {
  let json : QrPlayload;

  try{
    const tunnelURL = `${(await getTunnelUrl(env.TUNNEL_METRICS_URL))}/api/v1`;
    const pairingToken = await generatePairingToken();

    json = { url : tunnelURL, token : pairingToken.token, serverId: pairingToken.serverId ?? "" }

    QRCodeData = await QRCode.toDataURL(JSON.stringify(json), {
      width: 400,
      margin: 2,
      errorCorrectionLevel: "M",
    });

    await open(`http://localhost:${PORT}/`);  

    console.log("Theo pairing page opened in your browser.");
  } catch(e) {

  }
  console.log(`Theo backend running on port ${4000} (${"DEVELOPMENT"})`, {
    source: "server",
  });
});