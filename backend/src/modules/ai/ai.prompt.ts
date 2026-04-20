import type { AIContextDTO } from "./dto/ai.dto";

export const PROMPT_VERSION = "v1.0";

export function buildPrompts(context: AIContextDTO): {
  systemPrompt: string;
  userPrompt: string;
} {
  const toneInstructions: Record<string, string> = {
    warm: "Use a warm, friendly, and personable tone. Show genuine interest.",
    neutral: "Use a professional, balanced tone. Be clear and respectful.",
    direct: "Be concise and direct. Get to the point quickly while remaining polite.",
  };

  const lengthInstructions: Record<string, string> = {
    short: "Keep the email under 100 words.",
    medium: "Aim for 100–200 words.",
    long: "Write a detailed email of 200–350 words.",
  };

  const systemPrompt = `You are a PR outreach specialist writing personalized emails to journalists and media contacts.

Rules:
- Write a subject line and email body for a PR outreach email.
- Use ONLY the facts provided in the context below. Do NOT invent quotes, statistics, or events.
- Do NOT include placeholder brackets like [Your Name] or [Company].
- Do NOT include any URLs or links.
- ${toneInstructions[context.constraints.tone]}
- ${lengthInstructions[context.constraints.length]}
- Respond in valid JSON with exactly two keys: "subject" (string) and "body" (string).
- The body should be plain text, not HTML.`;

  const recentSummary =
    context.recentInteractions.length > 0
      ? context.recentInteractions
          .map(
            (i) =>
              `- [${i.occurredAt}] ${i.direction} ${i.channel}: ${i.subject ? i.subject + " — " : ""}${i.content.slice(0, 200)}`
          )
          .join("\n")
      : "No previous interactions.";

  const userPrompt = `Generate an outreach email based on this context:

CONTACT:
- Name: ${context.contact.name}
- Outlet: ${context.contact.outlet}
- Topics: ${context.contact.topics.join(", ") || "General"}
- Relationship score: ${context.contact.score}/100
- Last contacted: ${context.contact.lastContactedAt ?? "Never"}

CAMPAIGN:
- Name: ${context.campaign.name}
- Objective: ${context.campaign.objective}

RECENT INTERACTIONS:
${recentSummary}

Respond with JSON: {"subject": "...", "body": "..."}`;

  return { systemPrompt, userPrompt };
}
