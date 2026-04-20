import { AppError } from "../../../shared/errors/AppError";
import { env } from "../../../config/env";
import type { CompletionResult } from "./openai.provider";

const TIMEOUT_MS = 30_000;

export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string
): Promise<CompletionResult> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError("Gemini API key is not configured (GEMINI_API_KEY)", 503);
  }

  const model = env.GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg =
        (err as any)?.error?.message ?? `Gemini returned ${res.status}`;
      throw new AppError(`AI generation failed: ${msg}`, 502);
    }

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      throw new AppError("Gemini returned an empty response", 502);
    }

    // Gemini may wrap JSON in markdown fences or extra text — extract the JSON object
    let cleaned = raw.trim();

    // Strip markdown code fences (possibly with language tag)
    cleaned = cleaned.replace(/^```[\s\S]*?\n/, "").replace(/\n?```\s*$/, "").trim();

    // If still not valid JSON, try to extract the first { ... } block
    if (!cleaned.startsWith("{")) {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) cleaned = match[0];
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new AppError("Gemini returned invalid JSON", 502);
    }

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
