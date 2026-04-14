import { pool } from "../../config/db";
import { NotFoundError, BadRequestError } from "../../shared/errors/AppError";
import * as interactionsRepo from "./interactions.repository";
import * as contactsRepo from "../contacts/contacts.repository";
import * as campaignsRepo from "../campaigns/campaigns.repository";
import { logEvent } from "../../shared/audit/audit.repository";
import type { PaginatedResult } from "@pr-outreach/shared-types";
import type {
  CreateInteractionDTO,
  InteractionResponseDTO,
} from "./dto/interactions.dto";

function toResponseDTO(row: interactionsRepo.InteractionRow): InteractionResponseDTO {
  return {
    id: row.id,
    contactId: row.contact_id,
    campaignId: row.campaign_id,
    direction: row.direction as InteractionResponseDTO["direction"],
    channel: row.channel as InteractionResponseDTO["channel"],
    status: row.status as InteractionResponseDTO["status"],
    subject: row.subject,
    content: row.content,
    occurredAt: row.occurred_at.toISOString(),
    createdAt: row.created_at.toISOString(),
  };
}

export async function createInteraction(
  userId: number,
  dto: CreateInteractionDTO
): Promise<InteractionResponseDTO> {
  const contact = await contactsRepo.findById(userId, dto.contactId);
  if (!contact) throw new NotFoundError("Contact not found");
  if (contact.archived_at) throw new BadRequestError("Cannot create interaction for an archived contact");

  if (dto.campaignId) {
    const campaign = await campaignsRepo.findById(userId, dto.campaignId);
    if (!campaign) throw new NotFoundError("Campaign not found");
  }

  const isOutbound = dto.direction === "outbound";

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const row = await interactionsRepo.create(
      userId,
      dto.contactId,
      dto.campaignId ?? null,
      dto.direction,
      dto.channel,
      dto.status,
      dto.content,
      dto.subject ?? null,
      dto.occurredAt ?? null,
      dto.providerMessageId ?? null,
      dto.externalThreadId ?? null,
      dto.metadata ?? null,
      client
    );
    if (isOutbound) {
      await interactionsRepo.updateContactLastContacted(dto.contactId, client);
    }
    await contactsRepo.recalculateScore(dto.contactId, client);
    await logEvent(userId, "interaction", row.id, "created", { direction: dto.direction, channel: dto.channel }, client);
    await client.query("COMMIT");
    return toResponseDTO(row);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getInteraction(
  userId: number,
  interactionId: number
): Promise<InteractionResponseDTO> {
  const row = await interactionsRepo.findById(userId, interactionId);
  if (!row) throw new NotFoundError("Interaction not found");
  return toResponseDTO(row);
}

export async function listByContact(
  userId: number,
  contactId: number,
  limit: number,
  offset: number
): Promise<PaginatedResult<InteractionResponseDTO>> {
  const contact = await contactsRepo.findById(userId, contactId);
  if (!contact) throw new NotFoundError("Contact not found");

  const { rows, total } = await interactionsRepo.findByContact(userId, contactId, limit, offset);
  return { data: rows.map(toResponseDTO), total, limit, offset };
}

export async function listByCampaign(
  userId: number,
  campaignId: number,
  limit: number,
  offset: number
): Promise<PaginatedResult<InteractionResponseDTO>> {
  const campaign = await campaignsRepo.findById(userId, campaignId);
  if (!campaign) throw new NotFoundError("Campaign not found");

  const { rows, total } = await interactionsRepo.findByCampaign(userId, campaignId, limit, offset);
  return { data: rows.map(toResponseDTO), total, limit, offset };
}

export async function listAll(
  userId: number,
  limit: number,
  offset: number
): Promise<PaginatedResult<InteractionResponseDTO>> {
  const { rows, total } = await interactionsRepo.findAllByUser(userId, limit, offset);
  return { data: rows.map(toResponseDTO), total, limit, offset };
}
