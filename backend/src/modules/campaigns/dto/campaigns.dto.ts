import { z } from "zod";

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

export type CampaignStatus = z.infer<typeof campaignStatusEnum>;
export type CreateCampaignDTO = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignDTO = z.infer<typeof updateCampaignSchema>;
export type AddContactsToCampaignDTO = z.infer<typeof addContactsSchema>;

export interface CampaignResponseDTO {
  id: number;
  name: string;
  description: string;
  objective: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignParticipantDTO {
  campaignContactId: number;
  contactId: number;
  contactName: string;
  outlet: string;
  status: string;
  lastOutreachAt: string | null;
}
