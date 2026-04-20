import { env } from "../../../config/env";
import { generateCompletion as openaiGenerate } from "./openai.provider";
import { generateCompletion as geminiGenerate } from "./gemini.provider";

export type { CompletionResult } from "./openai.provider";

const providers = {
  openai: openaiGenerate,
  gemini: geminiGenerate,
} as const;

export function generateCompletion(
  systemPrompt: string,
  userPrompt: string
): Promise<{ subject: string; body: string }> {
  const fn = providers[env.AI_PROVIDER];
  return fn(systemPrompt, userPrompt);
}

/** Returns the model string for the active provider (used for audit/DB). */
export function getActiveModel(): string {
  return env.AI_PROVIDER === "gemini" ? env.GEMINI_MODEL : env.AI_PROVIDER_MODEL;
}
