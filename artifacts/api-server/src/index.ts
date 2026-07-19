import app from "./app";
import { logger } from "./lib/logger";
import { warmupRateLimiter } from "./middlewares/rateLimiter";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Warm up the rate-limiter cache before accepting requests so a server
// restart after the daily limit is hit does not allow any extra calls through.
await warmupRateLimiter();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
