import { pool } from "../../config/db";
import type { PoolClient } from "pg";

export type AuditAction =
  | "created"
  | "updated"
  | "archived"
  | "deleted"
  | "login"
  | "logout"
  | "register";

export type AuditEntityType =
  | "user"
  | "contact"
  | "campaign"
  | "interaction"
  | "campaign_contact"
  | "ai_suggestion"
  | "messaging";

export async function logEvent(
  userId: number | null,
  entityType: AuditEntityType,
  entityId: number,
  action: AuditAction,
  metadata?: Record<string, unknown> | null,
  client?: PoolClient
): Promise<void> {
  const q = client ?? pool;
  await q.query(
    `INSERT INTO audit_events (user_id, entity_type, entity_id, action, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, entityType, entityId, action, metadata ? JSON.stringify(metadata) : null]
  );
}
