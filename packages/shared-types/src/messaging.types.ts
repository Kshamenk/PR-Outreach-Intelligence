// ── Request ──

export interface SendEmailDTO {
  contactId: number;
  campaignId?: number;
  subject: string;
  body: string;
  aiSuggestionId?: number;
}

// ── Response ──

export interface SendEmailResponseDTO {
  interactionId: number;
  providerMessageId?: string;
  status: "sent" | "queued" | "failed";
}
