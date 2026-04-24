import { pool } from "../config/db";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import app from "../app";

export { app };

/**
 * Generate a valid JWT access token for a test user.
 */
export function authToken(userId: number, email = "test@example.com"): string {
  return jwt.sign({ userId, email }, env.JWT_SECRET, { expiresIn: "15m" });
}

/**
 * Truncate all tables between test suites to ensure isolation.
 * Uses CASCADE so FK constraints don't block.
 */
export async function cleanDatabase(): Promise<void> {
  await pool.query(`
    TRUNCATE users, auth_sessions, contacts, campaigns, campaign_contacts,
             interactions, ai_suggestions, audit_events
    CASCADE
  `);
}

/**
 * Create a test user directly in the database (bypassing the service layer).
 * Returns the user row + a plaintext password for login tests.
 */
export async function createTestUser(
  email = "test@example.com",
  password = "testpassword123"
): Promise<{ id: number; email: string; password: string }> {
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash(password, 4); // Low rounds for speed
  const { rows } = await pool.query(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
    [email, hash]
  );
  return { ...rows[0], password };
}
