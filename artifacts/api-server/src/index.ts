import { createServer } from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { initWebSocket } from "./lib/websocket";
import { seedDatabase } from "./lib/seed";
import { startDemandSimulator } from "./lib/demand-simulator";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = createServer(app);
initWebSocket(server);

server.listen(port, async () => {
  logger.info({ port }, "Server listening");
  try {
    await seedDatabase();
  } catch (err) {
    logger.warn({ err }, "Seed skipped or failed (non-fatal)");
  }
  startDemandSimulator();
});
