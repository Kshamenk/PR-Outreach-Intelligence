import { describe, it, expect } from "vitest";
import { sendEmailSchema } from "../dto/messaging.dto";

describe("sendEmailSchema", () => {
  it("should accept valid email data", () => {
    const result = sendEmailSchema.safeParse({
      contactId: 1,
      subject: "Press Release: New Product",
      body: "Dear journalist, we are excited to announce...",
    });
    expect(result.success).toBe(true);
  });

  it("should accept with optional campaign and suggestion", () => {
    const result = sendEmailSchema.safeParse({
      contactId: 1,
      campaignId: 5,
      subject: "Follow up",
      body: "Just checking in...",
      aiSuggestionId: 10,
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty subject", () => {
    expect(
      sendEmailSchema.safeParse({ contactId: 1, subject: "", body: "test" }).success
    ).toBe(false);
  });

  it("should reject empty body", () => {
    expect(
      sendEmailSchema.safeParse({ contactId: 1, subject: "Hi", body: "" }).success
    ).toBe(false);
  });

  it("should reject missing contactId", () => {
    expect(
      sendEmailSchema.safeParse({ subject: "Hi", body: "Hello" }).success
    ).toBe(false);
  });

  it("should reject subject over 500 chars", () => {
    expect(
      sendEmailSchema.safeParse({
        contactId: 1,
        subject: "a".repeat(501),
        body: "test",
      }).success
    ).toBe(false);
  });
});
