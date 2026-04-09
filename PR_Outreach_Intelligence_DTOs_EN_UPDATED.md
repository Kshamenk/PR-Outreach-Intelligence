# DTOs / Contracts

## auth

### RegisterDTO
```ts
export interface RegisterDTO {
  email: string;
  password: string;
}
```

### LoginDTO
```ts
export interface LoginDTO {
  email: string;
  password: string;
}
```

### AuthResponseDTO
```ts
export interface AuthResponseDTO {
  user: {
    id: number;
    email: string;
  };
  accessToken: string;
}
```

### MeResponseDTO
```ts
export interface MeResponseDTO {
  id: number;
  email: string;
  createdAt: string;
}
```

## contacts

### CreateContactDTO
```ts
export interface CreateContactDTO {
  name: string;
  email: string;
  outlet: string;
  topics: string[];
}
```

### UpdateContactDTO
```ts
export interface UpdateContactDTO {
  name?: string;
  email?: string;
  outlet?: string;
  topics?: string[];
  archivedAt?: string | null;
}
```

### ContactResponseDTO
```ts
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
```

### ContactListItemDTO
```ts
export interface ContactListItemDTO {
  id: number;
  name: string;
  outlet: string;
  score: number;
  lastContactedAt: string | null;
  campaignCount: number;
}
```

## interactions

### InteractionDirection
```ts
export type InteractionDirection = "inbound" | "outbound" | "internal";
```

### InteractionChannel
```ts
export type InteractionChannel = "email" | "note";
```

### InteractionStatus
```ts
export type InteractionStatus = "draft" | "sent" | "delivered" | "failed" | "replied" | "archived";
```

### CreateInteractionDTO
```ts
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
```

### InteractionResponseDTO
```ts
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
```

## campaigns

### CampaignStatus
```ts
export type CampaignStatus = "draft" | "active" | "paused" | "completed";
```

### CreateCampaignDTO
```ts
export interface CreateCampaignDTO {
  name: string;
  description: string;
  objective: string;
}
```

### UpdateCampaignDTO
```ts
export interface UpdateCampaignDTO {
  name?: string;
  description?: string;
  objective?: string;
  status?: CampaignStatus;
}
```

### AddContactsToCampaignDTO
```ts
export interface AddContactsToCampaignDTO {
  contactIds: number[];
}
```

### CampaignResponseDTO
```ts
export interface CampaignResponseDTO {
  id: number;
  name: string;
  description: string;
  objective: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}
```

### CampaignParticipantDTO
```ts
export interface CampaignParticipantDTO {
  campaignContactId: number;
  contactId: number;
  contactName: string;
  outlet: string;
  status: string;
  lastOutreachAt: string | null;
}
```

## ai

### GenerateOutreachDTO
```ts
export interface GenerateOutreachDTO {
  contactId: number;
  campaignId: number;
  tone?: "warm" | "neutral" | "direct";
  length?: "short" | "medium" | "long";
}
```

### GenerateOutreachResponseDTO
```ts
export interface GenerateOutreachResponseDTO {
  suggestionId: number;
  subject: string;
  body: string;
  model: string;
  promptVersion: string;
}
```

### SaveAIDraftDTO
```ts
export interface SaveAIDraftDTO {
  contactId: number;
  campaignId: number;
  subject: string;
  body: string;
  model?: string;
  promptVersion?: string;
}
```

### AIContextDTO
```ts
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
```

## messaging

### SendEmailDTO
```ts
export interface SendEmailDTO {
  contactId: number;
  campaignId?: number;
  subject: string;
  body: string;
  aiSuggestionId?: number;
}
```

### SendEmailResponseDTO
```ts
export interface SendEmailResponseDTO {
  interactionId: number;
  providerMessageId?: string;
  status: "sent" | "queued" | "failed";
}
```

## dashboard

### DashboardStatsDTO
```ts
export interface DashboardStatsDTO {
  totalContacts: number;
  activeCampaigns: number;
  emailsSent: number;
  repliesReceived: number;
  responseRate: number;
  draftsPendingReview: number;
}
```

### RecentActivityDTO
```ts
export interface RecentActivityDTO {
  id: number;
  type: "contact_created" | "campaign_created" | "draft_generated" | "email_sent" | "reply_received";
  title: string;
  description: string;
  createdAt: string;
}
```
