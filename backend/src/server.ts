import { env } from "./config/env";
import { pool } from "./config/db";
import app from "./app";

const server = app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

function shutdown() {
  console.log("Shutting down gracefully...");
  server.close(() => {
    pool.end().then(() => process.exit(0));
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);