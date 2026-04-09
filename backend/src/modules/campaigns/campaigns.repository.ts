import { pool } from "../../config/db";

export interface CampaignRow {
  id: number;
  user_id: number;
  name: string;
  description: string;
  objective: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CampaignParticipantRow {
  id: number;
  contact_id: number;
  contact_name: string;
  outlet: string;
  status: string;
  last_outreach_at: Date | null;
}

const ALLOWED_UPDATE_COLUMNS = ["name", "description", "objective", "status"] as const;

export async function create(
  userId: number,
  name: string,
  description: string,
  objective: string
): Promise<CampaignRow> {
  const { rows } = await pool.query<CampaignRow>(
    `INSERT INTO campaigns (user_id, name, description, objective)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, name, description, objective]
  );
  return rows[0];
}

export async function findById(userId: number, campaignId: number): Promise<CampaignRow | null> {
  const { rows } = await pool.query<CampaignRow>(
    "SELECT * FROM campaigns WHERE id = $1 AND user_id = $2",
    [campaignId, userId]
  );
  return rows[0] ?? null;
}

export async function findAllByUser(userId: number): Promise<CampaignRow[]> {
  const { rows } = await pool.query<CampaignRow>(
    "SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return rows;
}

export async function update(
  userId: number,
  campaignId: number,
  fields: Partial<{
    name: string;
    description: string;
    objective: string;
    status: string;
  }>
): Promise<CampaignRow | null> {
  const entries = Object.entries(fields).filter(
    ([k, v]) => v !== undefined && (ALLOWED_UPDATE_COLUMNS as readonly string[]).includes(k)
  );
  if (entries.length === 0) return findById(userId, campaignId);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 3}`);
  setClauses.push("updated_at = NOW()");

  const values = entries.map(([, v]) => v);

  const { rows } = await pool.query<CampaignRow>(
    `UPDATE campaigns SET ${setClauses.join(", ")}
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [campaignId, userId, ...values]
  );
  return rows[0] ?? null;
}

export async function addContacts(
  campaignId: number,
  contactIds: number[]
): Promise<number> {
  if (contactIds.length === 0) return 0;

  const valuePlaceholders = contactIds
    .map((_, i) => `($1, $${i + 2})`)
    .join(", ");

  const { rowCount } = await pool.query(
    `INSERT INTO campaign_contacts (campaign_id, contact_id)
     VALUES ${valuePlaceholders}
     ON CONFLICT (campaign_id, contact_id) DO NOTHING`,
    [campaignId, ...contactIds]
  );
  return rowCount ?? 0;
}

export async function removeContact(
  campaignId: number,
  contactId: number
): Promise<boolean> {
  const { rowCount } = await pool.query(
    "DELETE FROM campaign_contacts WHERE campaign_id = $1 AND contact_id = $2",
    [campaignId, contactId]
  );
  return (rowCount ?? 0) > 0;
}

export async function getParticipants(campaignId: number): Promise<CampaignParticipantRow[]> {
  const { rows } = await pool.query<CampaignParticipantRow>(
    `SELECT
       cc.id,
       cc.contact_id,
       c.name AS contact_name,
       c.outlet,
       cc.status,
       cc.last_outreach_at
     FROM campaign_contacts cc
     JOIN contacts c ON c.id = cc.contact_id
     WHERE cc.campaign_id = $1
     ORDER BY cc.assigned_at DESC`,
    [campaignId]
  );
  return rows;
}
