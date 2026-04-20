import { z } from "zod";

export type {
  GenerateOutreachDTO,
  GenerateOutreachResponseDTO,
  SaveAIDraftDTO,
  AIContextDTO,
} from "@pr-outreach/shared-types";

export const generateOutreachSchema = z.object({
  contactId: z.number().int().positive(),
  campaignId: z.number().int().positive(),
  tone: z.enum(["warm", "neutral", "direct"]).default("neutral"),
  length: z.enum(["short", "medium", "long"]).default("medium"),
});

export const rejectSuggestionSchema = z.object({
  reason: z.string().max(500).optional(),
});
