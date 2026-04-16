// ── Request ──

export interface CreateContactDTO {
  name: string;
  email: string;
  outlet: string;
  topics: string[];
}

export interface UpdateContactDTO {
  name?: string;
  email?: string;
  outlet?: string;
  topics?: string[];
  archivedAt?: string | null;
}

// ── Response ──

export interface ContactResponseDTO {
  id: number;
  name: string;
  email: string;
  outlet: string;
  topics: string[];
  score: number;
  lastContactedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactListItemDTO {
  id: number;
  name: string;
  outlet: string;
  score: number;
  lastContactedAt: string | null;
  campaignCount: number;
}
