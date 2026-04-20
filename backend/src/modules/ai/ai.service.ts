import { NotFoundError, BadRequestError } from "../../shared/errors/AppError";
import * as aiRepo from "./ai.repository";
import * as contactsRepo from "../contacts/contacts.repository";
import * as campaignsRepo from "../campaigns/campaigns.repository";
import * as interactionsRepo from "../interactions/interactions.repository";
import { logEvent } from "../../shared/audit/audit.repository";
import { generateCompletion, getActiveModel } from "./ai.provider";
import { buildPrompts, PROMPT_VERSION } from "./ai.prompt";
import type { PaginatedResult, AISuggestionDTO } from "@pr-outreach/shared-types";
import type {
  GenerateOutreachDTO,
  GenerateOutreachResponseDTO,
  AIContextDTO,
} from "./dto/ai.dto";

function toSuggestionDTO(row: aiRepo.AISuggestionRow): AISuggestionDTO {
  return {
    id: row.id,
    contactId: row.contact_id,
    campaignId: row.campaign_id,
    subject: row.subject,
    body: row.body,
    status: row.status,
    model: row.model,
    promptVersion: row.prompt_version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function generate(
  userId: number,
  dto: GenerateOutreachDTO
): Promise<GenerateOutreachResponseDTO> {
  const contact = await contactsRepo.findById(userId, dto.contactId);
  if (!contact) throw new NotFoundError("Contact not found");
  if (contact.archived_at) throw new BadRequestError("Cannot generate outreach for an archived contact");

  const campaign = await campaignsRepo.findById(userId, dto.campaignId);
  if (!campaign) throw new NotFoundError("Campaign not found");

  // Fetch recent interactions for context (last 10)
  const { rows: recentInteractions } = await interactionsRepo.findByContact(
    userId,
    dto.contactId,
    10,
    0
  );

  const context: AIContextDTO = {
    contact: {
      id: contact.id,
      name: contact.name,
      outlet: contact.outlet,
      topics: contact.topics,
      score: contact.relationship_score,
      lastContactedAt: contact.last_contacted_at?.toISOString() ?? null,
    },
    campaign: {
      id: campaign.id,
      name: campaign.name,
      objective: campaign.objective,
    },
    recentInteractions: recentInteractions.map((i) => ({
      id: i.id,
      direction: i.direction as "inbound" | "outbound" | "internal",
      channel: i.channel as "email" | "note",
      subject: i.subject,
      content: i.content,
      occurredAt: i.occurred_at.toISOString(),
    })),
    constraints: {
      tone: dto.tone ?? "neutral",
      length: dto.length ?? "medium",
    },
  };

  const { systemPrompt, userPrompt } = buildPrompts(context);
  const { subject, body } = await generateCompletion(systemPrompt, userPrompt);
  const model = getActiveModel();

  const row = await aiRepo.create(
    userId,
    dto.contactId,
    dto.campaignId,
    subject,
    body,
    model,
    PROMPT_VERSION
  );

  await logEvent(userId, "ai_suggestion", row.id, "created", { subject: row.subject, contactName: contact.name });

  return {
    suggestionId: row.id,
    subject: row.subject,
    body: row.body,
    model,
    promptVersion: PROMPT_VERSION,
  };
}

export async function getSuggestion(
  userId: number,
  suggestionId: number
): Promise<AISuggestionDTO> {
  const row = await aiRepo.findById(userId, suggestionId);
  if (!row) throw new NotFoundError("Suggestion not found");
  return toSuggestionDTO(row);
}

export async function listSuggestions(
  userId: number,
  limit: number,
  offset: number
): Promise<PaginatedResult<AISuggestionDTO>> {
  const { rows, total } = await aiRepo.findAllByUser(userId, limit, offset);
  return { data: rows.map(toSuggestionDTO), total, limit, offset };
}

export async function acceptSuggestion(
  userId: number,
  suggestionId: number
): Promise<AISuggestionDTO> {
  const row = await aiRepo.markAccepted(userId, suggestionId);
  if (!row) throw new NotFoundError("Suggestion not found or already processed");
  await logEvent(userId, "ai_suggestion", suggestionId, "updated", { action: "accepted", subject: row.subject });
  return toSuggestionDTO(row);
}

export async function rejectSuggestion(
  userId: number,
  suggestionId: number,
  reason?: string
): Promise<AISuggestionDTO> {
  const row = await aiRepo.markRejected(userId, suggestionId, reason);
  if (!row) throw new NotFoundError("Suggestion not found or already processed");
  await logEvent(userId, "ai_suggestion", suggestionId, "updated", { action: "rejected", subject: row.subject, reason });
  return toSuggestionDTO(row);
}
