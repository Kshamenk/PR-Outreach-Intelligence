import { pool } from "../../config/db";

interface StatsRow {
  total_contacts: string;
  active_campaigns: string;
  emails_sent: string;
  replies_received: string;
  drafts_pending: string;
}

export async function getStats(userId: number): Promise<StatsRow> {
  const { rows } = await pool.query<StatsRow>(
    `SELECT
       (SELECT COUNT(*) FROM contacts WHERE user_id = $1 AND archived_at IS NULL) AS total_contacts,
       (SELECT COUNT(*) FROM campaigns WHERE user_id = $1 AND status = 'active' AND archived_at IS NULL) AS active_campaigns,
       (SELECT COUNT(*) FROM interactions WHERE user_id = $1 AND direction = 'outbound' AND channel = 'email' AND status = 'sent') AS emails_sent,
       (SELECT COUNT(*) FROM interactions WHERE user_id = $1 AND direction = 'inbound' AND status = 'replied') AS replies_received,
       (SELECT COUNT(*) FROM ai_suggestions WHERE user_id = $1 AND status = 'draft') AS drafts_pending`,
    [userId]
  );
  return rows[0];
}

interface RecentActivityRow {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

export async function getRecentActivity(
  userId: number,
  limit = 10
): Promise<RecentActivityRow[]> {
  const { rows } = await pool.query<RecentActivityRow>(
    `SELECT id, entity_type, entity_id, action, metadata, created_at
     FROM audit_events
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows;
}
