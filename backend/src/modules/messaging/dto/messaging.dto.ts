import { z } from "zod";

export type {
  SendEmailDTO,
  SendEmailResponseDTO,
} from "@pr-outreach/shared-types";

export const sendEmailSchema = z.object({
  contactId: z.number().int().positive(),
  campaignId: z.number().int().positive().optional(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
  aiSuggestionId: z.number().int().positive().optional(),
});
