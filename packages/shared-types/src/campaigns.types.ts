// ── Enums ──

export type CampaignStatus = "draft" | "active" | "paused" | "completed";

// ── Request ──

export interface CreateCampaignDTO {
  name: string;
  description: string;
  objective: string;
}

export interface UpdateCampaignDTO {
  name?: string;
  description?: string;
  objective?: string;
  status?: CampaignStatus;
}

export interface AddContactsToCampaignDTO {
  contactIds: number[];
}

// ── Response ──

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
