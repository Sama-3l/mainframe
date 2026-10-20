import { createApp } from "../app/app";
import { getTunnelUrl } from "../modules/pair/getURL";
import { env } from "../config/env"

const app = createApp();

const server = app.listen(4000, async () => {
  console.log(`Theo backend running on port ${4000} (${"DEVELOPMENT"})`, {
    source: "server",
  });
  const tunnelURL = await getTunnelUrl(env.TUNNEL_METRICS_URL);
  console.log(tunnelURL)
});

// async function shutdown(signal: string) {
//   logger.info(`Received ${signal}, shutting down gracefully...`, {
//     source: "server",
//   });
//   server.close(async () => {
//     await prisma.$disconnect();
//     logger.info("Shutdown complete.", { source: "server" });
//     process.exit(0);
//   });
// }

// process.on("SIGINT", () => shutdown("SIGINT"));
// process.on("SIGTERM", () => shutdown("SIGTERM"));

