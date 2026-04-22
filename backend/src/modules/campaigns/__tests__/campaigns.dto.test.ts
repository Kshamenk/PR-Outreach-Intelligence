import { describe, it, expect } from "vitest";
import {
  createCampaignSchema,
  updateCampaignSchema,
  addContactsSchema,
} from "../dto/campaigns.dto";

describe("createCampaignSchema", () => {
  it("should accept valid campaign data", () => {
    const result = createCampaignSchema.safeParse({
      name: "Q4 Launch",
      description: "Product launch campaign",
      objective: "Get press coverage",
    });
    expect(result.success).toBe(true);
  });

  it("should accept minimal data with defaults", () => {
    const result = createCampaignSchema.safeParse({ name: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("");
      expect(result.data.objective).toBe("");
    }
  });

  it("should reject empty name", () => {
    expect(createCampaignSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("should reject name over 255 chars", () => {
    expect(createCampaignSchema.safeParse({ name: "a".repeat(256) }).success).toBe(false);
  });

  it("should reject description over 2000 chars", () => {
    expect(
      createCampaignSchema.safeParse({ name: "Test", description: "a".repeat(2001) }).success
    ).toBe(false);
  });
});

describe("updateCampaignSchema", () => {
  it("should accept partial fields", () => {
    expect(updateCampaignSchema.safeParse({ name: "Updated" }).success).toBe(true);
    expect(updateCampaignSchema.safeParse({ status: "active" }).success).toBe(true);
    expect(updateCampaignSchema.safeParse({}).success).toBe(true);
  });

  it("should accept valid status values", () => {
    for (const status of ["draft", "active", "paused", "completed"]) {
      expect(updateCampaignSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it("should reject invalid status", () => {
    expect(updateCampaignSchema.safeParse({ status: "cancelled" }).success).toBe(false);
  });
});

describe("addContactsSchema", () => {
  it("should accept array of positive integers", () => {
    expect(addContactsSchema.safeParse({ contactIds: [1, 2, 3] }).success).toBe(true);
  });

  it("should reject empty array", () => {
    expect(addContactsSchema.safeParse({ contactIds: [] }).success).toBe(false);
  });

  it("should reject non-positive integers", () => {
    expect(addContactsSchema.safeParse({ contactIds: [0] }).success).toBe(false);
    expect(addContactsSchema.safeParse({ contactIds: [-1] }).success).toBe(false);
  });

  it("should reject non-integer values", () => {
    expect(addContactsSchema.safeParse({ contactIds: [1.5] }).success).toBe(false);
  });
});
