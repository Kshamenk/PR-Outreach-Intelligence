import { describe, it, expect } from "vitest";
import { buildPrompts, PROMPT_VERSION } from "../ai.prompt";
import type { AIContextDTO } from "../dto/ai.dto";

function buildTestContext(overrides?: Partial<AIContextDTO>): AIContextDTO {
  return {
    contact: {
      id: 1,
      name: "Sarah Johnson",
      outlet: "TechCrunch",
      topics: ["AI", "startups"],
      score: 45,
      lastContactedAt: "2026-04-01T10:00:00.000Z",
    },
    campaign: {
      id: 1,
      name: "Product Launch 2026",
      objective: "Get media coverage for the new AI product",
    },
    recentInteractions: [
      {
        id: 1,
        direction: "outbound",
        channel: "email",
        subject: "Intro to our AI product",
        content: "Hi Sarah, I wanted to reach out about our new AI product...",
        occurredAt: "2026-04-01T10:00:00.000Z",
      },
    ],
    constraints: {
      tone: "neutral",
      length: "medium",
    },
    ...overrides,
  };
}

describe("buildPrompts", () => {
  it("should return systemPrompt and userPrompt", () => {
    const ctx = buildTestContext();
    const { systemPrompt, userPrompt } = buildPrompts(ctx);

    expect(systemPrompt).toBeDefined();
    expect(systemPrompt.length).toBeGreaterThan(0);
    expect(userPrompt).toBeDefined();
    expect(userPrompt.length).toBeGreaterThan(0);
  });

  it("should include contact info in user prompt", () => {
    const ctx = buildTestContext();
    const { userPrompt } = buildPrompts(ctx);

    expect(userPrompt).toContain("Sarah Johnson");
    expect(userPrompt).toContain("TechCrunch");
    expect(userPrompt).toContain("AI");
    expect(userPrompt).toContain("startups");
  });

  it("should include campaign info in user prompt", () => {
    const ctx = buildTestContext();
    const { userPrompt } = buildPrompts(ctx);

    expect(userPrompt).toContain("Product Launch 2026");
    expect(userPrompt).toContain("Get media coverage");
  });

  it("should include recent interactions in user prompt", () => {
    const ctx = buildTestContext();
    const { userPrompt } = buildPrompts(ctx);

    expect(userPrompt).toContain("outbound");
    expect(userPrompt).toContain("Intro to our AI product");
  });

  it("should show 'No previous interactions' when empty", () => {
    const ctx = buildTestContext({ recentInteractions: [] });
    const { userPrompt } = buildPrompts(ctx);

    expect(userPrompt).toContain("No previous interactions");
  });

  it("should apply warm tone instructions", () => {
    const ctx = buildTestContext({ constraints: { tone: "warm", length: "medium" } });
    const { systemPrompt } = buildPrompts(ctx);

    expect(systemPrompt).toContain("warm");
    expect(systemPrompt).toContain("friendly");
  });

  it("should apply direct tone instructions", () => {
    const ctx = buildTestContext({ constraints: { tone: "direct", length: "short" } });
    const { systemPrompt } = buildPrompts(ctx);

    expect(systemPrompt).toContain("concise");
    expect(systemPrompt).toContain("direct");
  });

  it("should apply length constraints", () => {
    const short = buildPrompts(buildTestContext({ constraints: { tone: "neutral", length: "short" } }));
    expect(short.systemPrompt).toContain("under 100 words");

    const long = buildPrompts(buildTestContext({ constraints: { tone: "neutral", length: "long" } }));
    expect(long.systemPrompt).toContain("200–350 words");
  });

  it("should require JSON output in system prompt", () => {
    const ctx = buildTestContext();
    const { systemPrompt } = buildPrompts(ctx);

    expect(systemPrompt).toContain("JSON");
    expect(systemPrompt).toContain("subject");
    expect(systemPrompt).toContain("body");
  });
});

describe("PROMPT_VERSION", () => {
  it("should be a versioned string", () => {
    expect(PROMPT_VERSION).toBe("v1.0");
  });
});
