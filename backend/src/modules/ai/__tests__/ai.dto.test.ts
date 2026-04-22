import { describe, it, expect } from "vitest";
import {
  generateOutreachSchema,
  rejectSuggestionSchema,
} from "../dto/ai.dto";

describe("generateOutreachSchema", () => {
  it("should accept valid data with defaults", () => {
    const result = generateOutreachSchema.safeParse({
      contactId: 1,
      campaignId: 2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tone).toBe("neutral");
      expect(result.data.length).toBe("medium");
    }
  });

  it("should accept custom tone and length", () => {
    const result = generateOutreachSchema.safeParse({
      contactId: 1,
      campaignId: 2,
      tone: "warm",
      length: "short",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid tone", () => {
    const result = generateOutreachSchema.safeParse({
      contactId: 1,
      campaignId: 2,
      tone: "aggressive",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid length", () => {
    const result = generateOutreachSchema.safeParse({
      contactId: 1,
      campaignId: 2,
      length: "tiny",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing contactId", () => {
    expect(generateOutreachSchema.safeParse({ campaignId: 2 }).success).toBe(false);
  });

  it("should reject missing campaignId", () => {
    expect(generateOutreachSchema.safeParse({ contactId: 1 }).success).toBe(false);
  });
});

describe("rejectSuggestionSchema", () => {
  it("should accept with reason", () => {
    expect(rejectSuggestionSchema.safeParse({ reason: "Not relevant" }).success).toBe(true);
  });

  it("should accept without reason", () => {
    expect(rejectSuggestionSchema.safeParse({}).success).toBe(true);
  });

  it("should reject reason over 500 chars", () => {
    expect(rejectSuggestionSchema.safeParse({ reason: "a".repeat(501) }).success).toBe(false);
  });
});
