import { pool } from "../../config/db";

export interface AISuggestionRow {
  id: number;
  user_id: number;
  contact_id: number;
  campaign_id: number | null;
  subject: string;
  body: string;
  status: string;
  model: string | null;
  prompt_version: string | null;
  used_at: Date | null;
  rejected_at: Date | null;
  rejection_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function create(
  userId: number,
  contactId: number,
  campaignId: number | null,
  subject: string,
  body: string,
  model: string,
  promptVersion: string
): Promise<AISuggestionRow> {
  const { rows } = await pool.query<AISuggestionRow>(
    `INSERT INTO ai_suggestions (user_id, contact_id, campaign_id, subject, body, model, prompt_version)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, contactId, campaignId, subject, body, model, promptVersion]
  );
  return rows[0];
}

export async function findById(
  userId: number,
  suggestionId: number
): Promise<AISuggestionRow | null> {
  const { rows } = await pool.query<AISuggestionRow>(
    "SELECT * FROM ai_suggestions WHERE id = $1 AND user_id = $2",
    [suggestionId, userId]
  );
  return rows[0] ?? null;
}

export async function findAllByUser(
  userId: number,
  limit: number,
  offset: number
): Promise<{ rows: AISuggestionRow[]; total: number }> {
  const countResult = await pool.query<{ count: string }>(
    "SELECT COUNT(*) FROM ai_suggestions WHERE user_id = $1",
    [userId]
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const { rows } = await pool.query<AISuggestionRow>(
    `SELECT * FROM ai_suggestions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return { rows, total };
}

export async function markAccepted(
  userId: number,
  suggestionId: number
): Promise<AISuggestionRow | null> {
  const { rows } = await pool.query<AISuggestionRow>(
    `UPDATE ai_suggestions
     SET status = 'accepted', used_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND status = 'draft'
     RETURNING *`,
    [suggestionId, userId]
  );
  return rows[0] ?? null;
}

export async function markRejected(
  userId: number,
  suggestionId: number,
  reason?: string
): Promise<AISuggestionRow | null> {
  const { rows } = await pool.query<AISuggestionRow>(
    `UPDATE ai_suggestions
     SET status = 'rejected', rejected_at = NOW(), rejection_reason = $3, updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND status = 'draft'
     RETURNING *`,
    [suggestionId, userId, reason ?? null]
  );
  return rows[0] ?? null;
}

export async function markSent(
  userId: number,
  suggestionId: number,
  client?: import("pg").PoolClient
): Promise<AISuggestionRow | null> {
  const q = client ?? pool;
  const { rows } = await q.query<AISuggestionRow>(
    `UPDATE ai_suggestions
     SET status = 'sent', used_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND status = 'accepted'
     RETURNING *`,
    [suggestionId, userId]
  );
  return rows[0] ?? null;
}
