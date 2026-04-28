import { env } from "./config/env";
import { pool } from "./config/db";
import { cleanupExpiredSessions } from "./modules/auth/auth.repository";
import app from "./app";

const server = app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

// Periodically clean up expired auth sessions (every 6 hours)
const SESSION_CLEANUP_INTERVAL = 6 * 60 * 60 * 1000;
const cleanupTimer = setInterval(async () => {
  try {
    const deleted = await cleanupExpiredSessions(7);
    if (deleted > 0) console.log(`Session cleanup: removed ${deleted} expired sessions`);
  } catch (err) {
    console.error("Session cleanup failed:", err);
  }
}, SESSION_CLEANUP_INTERVAL);

function shutdown() {
  console.log("Shutting down gracefully...");
  clearInterval(cleanupTimer);
  server.close(() => {
    pool.end().then(() => process.exit(0));
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);