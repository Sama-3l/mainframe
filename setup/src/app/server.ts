import { createApp } from "../app/app";


const app = createApp();

const server = app.listen(4000, () => {
  console.log(`Theo backend running on port ${4000} (${"DEVELOPMENT"})`, {
    source: "server",
  });
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

