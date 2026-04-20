import { pool } from "../../config/db";
import type { PoolClient } from "pg";

export interface InteractionRow {
  id: number;
  user_id: number;
  contact_id: number;
  campaign_id: number | null;
  direction: string;
  channel: string;
  status: string;
  subject: string | null;
  content: string;
  provider_message_id: string | null;
  external_thread_id: string | null;
  occurred_at: Date;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

export async function create(
  userId: number,
  contactId: number,
  campaignId: number | null,
  direction: string,
  channel: string,
  status: string,
  content: string,
  subject: string | null,
  occurredAt: string | null,
  providerMessageId: string | null,
  externalThreadId: string | null,
  metadata: Record<string, unknown> | null,
  client?: PoolClient
): Promise<InteractionRow> {
  const q = client ?? pool;
  const { rows } = await q.query<InteractionRow>(
    `INSERT INTO interactions
       (user_id, contact_id, campaign_id, direction, channel, status,
        content, subject, occurred_at, provider_message_id, external_thread_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9::timestamptz, NOW()), $10, $11, $12)
     RETURNING *`,
    [
      userId, contactId, campaignId, direction, channel, status,
      content, subject, occurredAt, providerMessageId, externalThreadId,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );
  return rows[0];
}

export async function findById(userId: number, interactionId: number): Promise<InteractionRow | null> {
  const { rows } = await pool.query<InteractionRow>(
    "SELECT * FROM interactions WHERE id = $1 AND user_id = $2",
    [interactionId, userId]
  );
  return rows[0] ?? null;
}

export async function findByContact(
  userId: number,
  contactId: number,
  limit: number,
  offset: number
): Promise<{ rows: InteractionRow[]; total: number }> {
  const countResult = await pool.query<{ count: string }>(
    "SELECT COUNT(*) FROM interactions WHERE user_id = $1 AND contact_id = $2",
    [userId, contactId]
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const { rows } = await pool.query<InteractionRow>(
    `SELECT * FROM interactions
     WHERE user_id = $1 AND contact_id = $2
     ORDER BY occurred_at DESC
     LIMIT $3 OFFSET $4`,
    [userId, contactId, limit, offset]
  );
  return { rows, total };
}

export async function findByCampaign(
  userId: number,
  campaignId: number,
  limit: number,
  offset: number
): Promise<{ rows: InteractionRow[]; total: number }> {
  const countResult = await pool.query<{ count: string }>(
    "SELECT COUNT(*) FROM interactions WHERE user_id = $1 AND campaign_id = $2",
    [userId, campaignId]
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const { rows } = await pool.query<InteractionRow>(
    `SELECT * FROM interactions
     WHERE user_id = $1 AND campaign_id = $2
     ORDER BY occurred_at DESC
     LIMIT $3 OFFSET $4`,
    [userId, campaignId, limit, offset]
  );
  return { rows, total };
}

export async function findAllByUser(
  userId: number,
  limit: number,
  offset: number
): Promise<{ rows: InteractionRow[]; total: number }> {
  const countResult = await pool.query<{ count: string }>(
    "SELECT COUNT(*) FROM interactions WHERE user_id = $1",
    [userId]
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const { rows } = await pool.query<InteractionRow>(
    `SELECT * FROM interactions
     WHERE user_id = $1
     ORDER BY occurred_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return { rows, total };
}

export async function updateContactLastContacted(
  contactId: number,
  client?: PoolClient
): Promise<void> {
  const q = client ?? pool;
  await q.query(
    "UPDATE contacts SET last_contacted_at = NOW(), updated_at = NOW() WHERE id = $1",
    [contactId]
  );
}

export async function updateCampaignContactStatus(
  campaignId: number,
  contactId: number,
  status: string,
  client?: PoolClient
): Promise<void> {
  const q = client ?? pool;
  await q.query(
    `UPDATE campaign_contacts
     SET status = $1, last_outreach_at = NOW()
     WHERE campaign_id = $2 AND contact_id = $3`,
    [status, campaignId, contactId]
  );
}
