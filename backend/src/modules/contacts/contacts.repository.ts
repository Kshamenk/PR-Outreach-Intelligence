import { pool } from "../../config/db";

export interface ContactRow {
  id: number;
  user_id: number;
  name: string;
  email: string;
  outlet: string;
  topics: string[];
  relationship_score: number;
  last_contacted_at: Date | null;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ContactListRow {
  id: number;
  name: string;
  outlet: string;
  relationship_score: number;
  last_contacted_at: Date | null;
  campaign_count: string; // COUNT returns string in pg
}

export async function create(
  userId: number,
  name: string,
  email: string,
  outlet: string,
  topics: string[]
): Promise<ContactRow> {
  const { rows } = await pool.query<ContactRow>(
    `INSERT INTO contacts (user_id, name, email, outlet, topics)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, name, email, outlet, topics]
  );
  return rows[0];
}

export async function findById(userId: number, contactId: number): Promise<ContactRow | null> {
  const { rows } = await pool.query<ContactRow>(
    "SELECT * FROM contacts WHERE id = $1 AND user_id = $2",
    [contactId, userId]
  );
  return rows[0] ?? null;
}

export async function findAllByUser(userId: number): Promise<ContactListRow[]> {
  const { rows } = await pool.query<ContactListRow>(
    `SELECT
       c.id,
       c.name,
       c.outlet,
       c.relationship_score,
       c.last_contacted_at,
       COUNT(cc.id)::text AS campaign_count
     FROM contacts c
     LEFT JOIN campaign_contacts cc ON cc.contact_id = c.id
     WHERE c.user_id = $1 AND c.archived_at IS NULL
     GROUP BY c.id
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return rows;
}

const ALLOWED_UPDATE_COLUMNS = ["name", "email", "outlet", "topics", "archived_at"] as const;

export async function update(
  userId: number,
  contactId: number,
  fields: Partial<{
    name: string;
    email: string;
    outlet: string;
    topics: string[];
    archived_at: string | null;
  }>
): Promise<ContactRow | null> {
  const entries = Object.entries(fields).filter(
    ([k, v]) => v !== undefined && (ALLOWED_UPDATE_COLUMNS as readonly string[]).includes(k)
  );
  if (entries.length === 0) return findById(userId, contactId);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 3}`);
  setClauses.push("updated_at = NOW()");

  const values = entries.map(([, v]) => v);

  const { rows } = await pool.query<ContactRow>(
    `UPDATE contacts SET ${setClauses.join(", ")}
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [contactId, userId, ...values]
  );
  return rows[0] ?? null;
}

export async function findByIds(userId: number, contactIds: number[]): Promise<ContactRow[]> {
  if (contactIds.length === 0) return [];
  const placeholders = contactIds.map((_, i) => `$${i + 2}`).join(", ");
  const { rows } = await pool.query<ContactRow>(
    `SELECT * FROM contacts WHERE id IN (${placeholders}) AND user_id = $1`,
    [userId, ...contactIds]
  );
  return rows;
}

export async function softDelete(userId: number, contactId: number): Promise<ContactRow | null> {
  const { rows } = await pool.query<ContactRow>(
    `UPDATE contacts SET archived_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND archived_at IS NULL
     RETURNING *`,
    [contactId, userId]
  );
  return rows[0] ?? null;
}
