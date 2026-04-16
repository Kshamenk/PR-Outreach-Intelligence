import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../config/env";
import { ConflictError, UnauthorizedError } from "../../shared/errors/AppError";
import {
  findUserByEmail,
  findUserById,
  createUserWithSession,
  createSession,
  findSessionByTokenHash,
  revokeSession,
  revokeAllUserSessions,
} from "./auth.repository";
import type { AuthResponseDTO, MeResponseDTO, RegisterDTO, LoginDTO } from "./dto/auth.dto";
import { logEvent } from "../../shared/audit/audit.repository";

const SALT_ROUNDS = 10;

function signAccessToken(userId: number, email: string): string {
  return jwt.sign({ userId, email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function parseExpiry(duration: string): Date {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration format: ${duration}`);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const ms = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit]!;
  return new Date(Date.now() + value * ms);
}

export async function register(
  dto: RegisterDTO,
  userAgent: string | null,
  ipAddress: string | null
): Promise<AuthResponseDTO> {
  const existing = await findUserByEmail(dto.email);
  if (existing) throw new ConflictError("Email already registered");

  const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
  const refreshToken = crypto.randomBytes(40).toString("hex");
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = parseExpiry(env.JWT_REFRESH_EXPIRES_IN);

  const { user } = await createUserWithSession(
    dto.email,
    passwordHash,
    refreshTokenHash,
    expiresAt,
    userAgent,
    ipAddress
  );

  const accessToken = signAccessToken(user.id, user.email);

  await logEvent(user.id, "user", user.id, "register");

  return {
    user: { id: user.id, email: user.email },
    accessToken,
    refreshToken,
  };
}

export async function login(
  dto: LoginDTO,
  userAgent: string | null,
  ipAddress: string | null
): Promise<AuthResponseDTO> {
  const user = await findUserByEmail(dto.email);
  if (!user) throw new UnauthorizedError("Invalid email or password");

  const valid = await bcrypt.compare(dto.password, user.password_hash);
  if (!valid) throw new UnauthorizedError("Invalid email or password");

  const accessToken = signAccessToken(user.id, user.email);
  const refreshToken = crypto.randomBytes(40).toString("hex");
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = parseExpiry(env.JWT_REFRESH_EXPIRES_IN);

  await createSession(user.id, refreshTokenHash, expiresAt, userAgent, ipAddress);

  await logEvent(user.id, "user", user.id, "login");

  return {
    user: { id: user.id, email: user.email },
    accessToken,
    refreshToken,
  };
}

export async function refresh(
  token: string,
  userAgent: string | null,
  ipAddress: string | null
): Promise<AuthResponseDTO> {
  const tokenHash = hashToken(token);
  const session = await findSessionByTokenHash(tokenHash);
  if (!session) throw new UnauthorizedError("Invalid refresh token");
  if (session.expires_at < new Date()) {
    await revokeSession(session.id);
    throw new UnauthorizedError("Refresh token expired");
  }

  await revokeSession(session.id);

  const user = await findUserById(session.user_id);
  if (!user) throw new UnauthorizedError("User not found");

  const accessToken = signAccessToken(user.id, user.email);
  const newRefreshToken = crypto.randomBytes(40).toString("hex");
  const newRefreshTokenHash = hashToken(newRefreshToken);
  const expiresAt = parseExpiry(env.JWT_REFRESH_EXPIRES_IN);

  await createSession(user.id, newRefreshTokenHash, expiresAt, userAgent, ipAddress);

  return {
    user: { id: user.id, email: user.email },
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  const session = await findSessionByTokenHash(tokenHash);
  if (session) {
    await revokeSession(session.id);
  }
}

export async function logoutAll(userId: number): Promise<void> {
  await revokeAllUserSessions(userId);
  await logEvent(userId, "user", userId, "logout");
}

export async function me(userId: number): Promise<MeResponseDTO> {
  const user = await findUserById(userId);
  if (!user) throw new UnauthorizedError("User not found");

  return {
    id: user.id,
    email: user.email,
    createdAt: user.created_at.toISOString(),
  };
}
