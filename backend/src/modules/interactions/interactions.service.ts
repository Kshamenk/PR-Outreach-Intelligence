import { pool } from "../../config/db";
import { NotFoundError } from "../../shared/errors/AppError";
import * as interactionsRepo from "./interactions.repository";
import * as contactsRepo from "../contacts/contacts.repository";
import * as campaignsRepo from "../campaigns/campaigns.repository";
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

  if (dto.campaignId) {
    const campaign = await campaignsRepo.findById(userId, dto.campaignId);
    if (!campaign) throw new NotFoundError("Campaign not found");
  }

  const isOutbound = dto.direction === "outbound";

  if (isOutbound) {
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
      await interactionsRepo.updateContactLastContacted(dto.contactId, client);
      await client.query("COMMIT");
      return toResponseDTO(row);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

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
    dto.metadata ?? null
  );
  return toResponseDTO(row);
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
): Promise<InteractionResponseDTO[]> {
  const contact = await contactsRepo.findById(userId, contactId);
  if (!contact) throw new NotFoundError("Contact not found");

  const rows = await interactionsRepo.findByContact(userId, contactId, limit, offset);
  return rows.map(toResponseDTO);
}

export async function listByCampaign(
  userId: number,
  campaignId: number,
  limit: number,
  offset: number
): Promise<InteractionResponseDTO[]> {
  const campaign = await campaignsRepo.findById(userId, campaignId);
  if (!campaign) throw new NotFoundError("Campaign not found");

  const rows = await interactionsRepo.findByCampaign(userId, campaignId, limit, offset);
  return rows.map(toResponseDTO);
}

export async function listAll(
  userId: number,
  limit: number,
  offset: number
): Promise<InteractionResponseDTO[]> {
  const rows = await interactionsRepo.findAllByUser(userId, limit, offset);
  return rows.map(toResponseDTO);
}
