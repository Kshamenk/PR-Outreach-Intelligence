import { NotFoundError, BadRequestError } from "../../shared/errors/AppError";
import * as contactsRepo from "./contacts.repository";
import { logEvent } from "../../shared/audit/audit.repository";
import type { PaginatedResult } from "@pr-outreach/shared-types";
import type {
  CreateContactDTO,
  UpdateContactDTO,
  ContactResponseDTO,
  ContactListItemDTO,
} from "./dto/contacts.dto";

function toResponseDTO(row: contactsRepo.ContactRow): ContactResponseDTO {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    outlet: row.outlet,
    topics: row.topics,
    score: row.relationship_score,
    lastContactedAt: row.last_contacted_at?.toISOString() ?? null,
    archivedAt: row.archived_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toListItemDTO(row: contactsRepo.ContactListRow): ContactListItemDTO {
  return {
    id: row.id,
    name: row.name,
    outlet: row.outlet,
    score: row.relationship_score,
    lastContactedAt: row.last_contacted_at?.toISOString() ?? null,
    campaignCount: parseInt(row.campaign_count, 10),
  };
}

export async function createContact(
  userId: number,
  dto: CreateContactDTO
): Promise<ContactResponseDTO> {
  const row = await contactsRepo.create(userId, dto.name, dto.email, dto.outlet, dto.topics);
  await logEvent(userId, "contact", row.id, "created", { name: row.name });
  return toResponseDTO(row);
}

export async function getContact(userId: number, contactId: number): Promise<ContactResponseDTO> {
  const row = await contactsRepo.findById(userId, contactId);
  if (!row) throw new NotFoundError("Contact not found");
  return toResponseDTO(row);
}

export async function listContacts(
  userId: number,
  limit: number,
  offset: number
): Promise<PaginatedResult<ContactListItemDTO>> {
  const { rows, total } = await contactsRepo.findAllByUser(userId, limit, offset);
  return { data: rows.map(toListItemDTO), total, limit, offset };
}

export async function updateContact(
  userId: number,
  contactId: number,
  dto: UpdateContactDTO
): Promise<ContactResponseDTO> {
  const existing = await contactsRepo.findById(userId, contactId);
  if (!existing) throw new NotFoundError("Contact not found");
  if (existing.archived_at && dto.archivedAt !== null) {
    throw new BadRequestError("Cannot update an archived contact. Restore it first.");
  }

  const fields: Record<string, unknown> = {};
  if (dto.name !== undefined) fields.name = dto.name;
  if (dto.email !== undefined) fields.email = dto.email;
  if (dto.outlet !== undefined) fields.outlet = dto.outlet;
  if (dto.topics !== undefined) fields.topics = dto.topics;
  if (dto.archivedAt !== undefined) fields.archived_at = dto.archivedAt;

  const row = await contactsRepo.update(userId, contactId, fields);
  if (!row) throw new NotFoundError("Contact not found");
  await logEvent(userId, "contact", contactId, "updated", { name: row.name });
  return toResponseDTO(row);
}

export async function deleteContact(userId: number, contactId: number): Promise<void> {
  const row = await contactsRepo.softDelete(userId, contactId);
  if (!row) throw new NotFoundError("Contact not found");
  await logEvent(userId, "contact", contactId, "archived", { name: row.name });
}
