import { pool } from "../../config/db";

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface SessionRow {
  id: number;
  user_id: number;
  refresh_token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: Date;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await pool.query<UserRow>(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return rows[0] ?? null;
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const { rows } = await pool.query<UserRow>(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}

export async function createUser(email: string, passwordHash: string): Promise<UserRow> {
  const { rows } = await pool.query<UserRow>(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
    [email, passwordHash]
  );
  return rows[0];
}

export async function createUserWithSession(
  email: string,
  passwordHash: string,
  refreshTokenHash: string,
  expiresAt: Date,
  userAgent: string | null,
  ipAddress: string | null
): Promise<{ user: UserRow; session: SessionRow }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: userRows } = await client.query<UserRow>(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
      [email, passwordHash]
    );
    const user = userRows[0];
    const { rows: sessionRows } = await client.query<SessionRow>(
      `INSERT INTO auth_sessions (user_id, refresh_token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.id, refreshTokenHash, expiresAt, userAgent, ipAddress]
    );
    await client.query("COMMIT");
    return { user, session: sessionRows[0] };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function createSession(
  userId: number,
  refreshTokenHash: string,
  expiresAt: Date,
  userAgent: string | null,
  ipAddress: string | null
): Promise<SessionRow> {
  const { rows } = await pool.query<SessionRow>(
    `INSERT INTO auth_sessions (user_id, refresh_token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, refreshTokenHash, expiresAt, userAgent, ipAddress]
  );
  return rows[0];
}

export async function findSessionByTokenHash(hash: string): Promise<SessionRow | null> {
  const { rows } = await pool.query<SessionRow>(
    "SELECT * FROM auth_sessions WHERE refresh_token_hash = $1 AND revoked_at IS NULL",
    [hash]
  );
  return rows[0] ?? null;
}

export async function revokeSession(sessionId: number): Promise<void> {
  await pool.query(
    "UPDATE auth_sessions SET revoked_at = NOW() WHERE id = $1",
    [sessionId]
  );
}

export async function revokeAllUserSessions(userId: number): Promise<void> {
  await pool.query(
    "UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
    [userId]
  );
}
