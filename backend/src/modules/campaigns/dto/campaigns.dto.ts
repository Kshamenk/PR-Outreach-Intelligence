import { z } from "zod";

export type {
  CampaignStatus,
  CreateCampaignDTO,
  UpdateCampaignDTO,
  AddContactsToCampaignDTO,
  CampaignResponseDTO,
  CampaignParticipantDTO,
} from "@pr-outreach/shared-types";

export const campaignStatusEnum = z.enum(["draft", "active", "paused", "completed"]);

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).default(""),
  objective: z.string().max(2000).default(""),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  objective: z.string().max(2000).optional(),
  status: campaignStatusEnum.optional(),
});

export const addContactsSchema = z.object({
  contactIds: z.array(z.number().int().positive()).min(1),
});
