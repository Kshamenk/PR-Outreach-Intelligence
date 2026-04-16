import { z } from "zod";

export type {
  InteractionDirection,
  InteractionChannel,
  InteractionStatus,
  CreateInteractionDTO,
  InteractionResponseDTO,
} from "@pr-outreach/shared-types";

export const interactionDirectionEnum = z.enum(["inbound", "outbound", "internal"]);
export const interactionChannelEnum = z.enum(["email", "note"]);
export const interactionStatusEnum = z.enum(["draft", "sent", "delivered", "failed", "replied", "archived"]);

export const createInteractionSchema = z.object({
  contactId: z.number().int().positive(),
  campaignId: z.number().int().positive().optional(),
  direction: interactionDirectionEnum,
  channel: interactionChannelEnum,
  status: interactionStatusEnum,
  subject: z.string().max(500).optional(),
  content: z.string().min(1).max(50000),
  occurredAt: z.string().datetime().optional(),
  providerMessageId: z.string().max(255).optional(),
  externalThreadId: z.string().max(255).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
