// ── Enums ──

export type InteractionDirection = "inbound" | "outbound" | "internal";
export type InteractionChannel = "email" | "note";
export type InteractionStatus = "draft" | "sent" | "delivered" | "failed" | "replied" | "archived";

// ── Request ──

export interface CreateInteractionDTO {
  contactId: number;
  campaignId?: number;
  direction: InteractionDirection;
  channel: InteractionChannel;
  status: InteractionStatus;
  subject?: string;
  content: string;
  occurredAt?: string;
  providerMessageId?: string;
  externalThreadId?: string;
  metadata?: Record<string, unknown>;
}

// ── Response ──

export interface InteractionResponseDTO {
  id: number;
  contactId: number;
  campaignId: number | null;
  direction: InteractionDirection;
  channel: InteractionChannel;
  status: InteractionStatus;
  subject: string | null;
  content: string;
  occurredAt: string;
  createdAt: string;
}
