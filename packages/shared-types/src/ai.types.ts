// ── Request ──

export interface GenerateOutreachDTO {
  contactId: number;
  campaignId: number;
  tone?: "warm" | "neutral" | "direct";
  length?: "short" | "medium" | "long";
}

export interface SaveAIDraftDTO {
  contactId: number;
  campaignId: number;
  subject: string;
  body: string;
  model?: string;
  promptVersion?: string;
}

// ── Response ──

export interface GenerateOutreachResponseDTO {
  suggestionId: number;
  subject: string;
  body: string;
  model: string;
  promptVersion: string;
}

export interface AISuggestionDTO {
  id: number;
  contactId: number;
  campaignId: number | null;
  subject: string;
  body: string;
  status: string;
  model: string | null;
  promptVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Context (used internally and by AI module) ──

export interface AIContextDTO {
  contact: {
    id: number;
    name: string;
    outlet: string;
    topics: string[];
    score: number;
    lastContactedAt: string | null;
  };
  campaign: {
    id: number;
    name: string;
    objective: string;
  };
  recentInteractions: Array<{
    id: number;
    direction: "inbound" | "outbound" | "internal";
    channel: "email" | "note";
    subject: string | null;
    content: string;
    occurredAt: string;
  }>;
  constraints: {
    tone: "warm" | "neutral" | "direct";
    length: "short" | "medium" | "long";
  };
}
