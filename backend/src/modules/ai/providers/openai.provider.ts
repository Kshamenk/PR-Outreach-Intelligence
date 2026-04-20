import { AppError } from "../../../shared/errors/AppError";
import { env } from "../../../config/env";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionResult {
  subject: string;
  body: string;
}

const TIMEOUT_MS = 30_000;

export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string
): Promise<CompletionResult> {
  const apiKey = env.AI_PROVIDER_API_KEY;
  if (!apiKey) {
    throw new AppError("OpenAI API key is not configured (AI_PROVIDER_API_KEY)", 503);
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: env.AI_PROVIDER_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = (err as any)?.error?.message ?? `AI provider returned ${res.status}`;
      throw new AppError(`AI generation failed: ${msg}`, 502);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) {
      throw new AppError("AI provider returned an empty response", 502);
    }

    const parsed = JSON.parse(raw);
    if (!parsed.subject || !parsed.body) {
      throw new AppError("AI response missing subject or body", 502);
    }

    return { subject: String(parsed.subject), body: String(parsed.body) };
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    if (err.name === "AbortError") {
      throw new AppError("AI generation timed out", 504);
    }
    throw new AppError(`AI generation failed: ${err.message}`, 502);
  } finally {
    clearTimeout(timeout);
  }
}
