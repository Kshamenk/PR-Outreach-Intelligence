export interface DashboardStatsDTO {
  totalContacts: number;
  activeCampaigns: number;
  emailsSent: number;
  repliesReceived: number;
  responseRate: number;
  draftsPendingReview: number;
}

export interface RecentActivityDTO {
  id: number;
  type: "contact_created" | "campaign_created" | "draft_generated" | "email_sent" | "reply_received";
  title: string;
  description: string;
  createdAt: string;
}
