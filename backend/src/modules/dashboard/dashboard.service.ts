import * as dashboardRepo from "./dashboard.repository";
import type { DashboardStatsDTO, RecentActivityDTO } from "@pr-outreach/shared-types";

const TYPE_MAP: Record<string, RecentActivityDTO["type"]> = {
  contact: "contact_created",
  campaign: "campaign_created",
  ai_suggestion: "draft_generated",
  interaction: "email_sent",
  messaging: "email_sent",
};

function mapActivityType(
  entityType: string,
  action: string,
  metadata: Record<string, unknown> | null
): RecentActivityDTO["type"] {
  if (entityType === "interaction" && metadata?.direction === "inbound") {
    return "reply_received";
  }
  return TYPE_MAP[entityType] ?? "contact_created";
}

function buildTitle(
  entityType: string,
  action: string,
  metadata: Record<string, unknown> | null
): string {
  const name = metadata?.name ?? metadata?.contactName ?? null;
  const subject = metadata?.subject ?? null;

  switch (entityType) {
    case "contact":
      if (action === "created") return name ? `New contact: ${name}` : "New contact added";
      if (action === "updated") return name ? `Updated contact: ${name}` : "Contact updated";
      if (action === "archived") return name ? `Archived contact: ${name}` : "Contact archived";
      return name ? `Contact: ${name}` : "Contact activity";
    case "campaign":
      if (action === "created") return name ? `New campaign: ${name}` : "New campaign created";
      if (action === "updated") {
        const subAction = metadata?.action as string | undefined;
        if (subAction === "contacts_added") return name ? `Added contacts to ${name}` : "Contacts added to campaign";
        if (subAction === "contact_removed") return name ? `Removed contact from ${name}` : "Contact removed from campaign";
        return name ? `Updated campaign: ${name}` : "Campaign updated";
      }
      if (action === "archived") return name ? `Archived campaign: ${name}` : "Campaign archived";
      return name ? `Campaign: ${name}` : "Campaign activity";
    case "interaction":
      if (metadata?.direction === "inbound") return subject ? `Reply received: ${subject}` : "Reply received";
      return subject ? `Email sent: ${subject}` : (name ? `Email sent to ${name}` : "Email sent");
    case "ai_suggestion": {
      const subAction = metadata?.action as string | undefined;
      if (subAction === "accepted") return subject ? `Draft accepted: ${subject}` : "Draft accepted";
      if (subAction === "rejected") return subject ? `Draft rejected: ${subject}` : "Draft rejected";
      return subject ? `Draft generated: ${subject}` : (name ? `Draft generated for ${name}` : "AI draft generated");
    }
    case "messaging":
      return subject ? `Email delivered: ${subject}` : "Email delivered";
    case "user":
      if (action === "logout") return "Logged out";
      if (action === "login") return "Logged in";
      if (action === "register") return "Account created";
      return "Account activity";
    default:
      return `${entityType} ${action}`;
  }
}

function buildDescription(
  entityType: string,
  action: string,
  metadata: Record<string, unknown> | null
): string {
  const parts: string[] = [];
  if (metadata?.name) parts.push(String(metadata.name));
  if (metadata?.contactName && metadata.contactName !== metadata.name) parts.push(`for ${metadata.contactName}`);
  if (metadata?.subject) parts.push(`"${metadata.subject}"`);
  if (metadata?.channel) parts.push(`via ${metadata.channel}`);
  return parts.length > 0 ? parts.join(" · ") : "";
}

export async function getStats(userId: number): Promise<DashboardStatsDTO> {
  const raw = await dashboardRepo.getStats(userId);
  const totalContacts = parseInt(raw.total_contacts, 10);
  const emailsSent = parseInt(raw.emails_sent, 10);
  const repliesReceived = parseInt(raw.replies_received, 10);

  return {
    totalContacts,
    activeCampaigns: parseInt(raw.active_campaigns, 10),
    emailsSent,
    repliesReceived,
    responseRate: emailsSent > 0 ? Math.round((repliesReceived / emailsSent) * 100) : 0,
    draftsPendingReview: parseInt(raw.drafts_pending, 10),
  };
}

export async function getRecentActivity(
  userId: number
): Promise<RecentActivityDTO[]> {
  const rows = await dashboardRepo.getRecentActivity(userId, 15);
  return rows.map((r) => ({
    id: r.id,
    type: mapActivityType(r.entity_type, r.action, r.metadata),
    title: buildTitle(r.entity_type, r.action, r.metadata),
    description: buildDescription(r.entity_type, r.action, r.metadata),
    createdAt: r.created_at.toISOString(),
  }));
}
