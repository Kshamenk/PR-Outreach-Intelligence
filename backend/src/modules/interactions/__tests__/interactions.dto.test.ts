import { describe, it, expect } from "vitest";
import { createInteractionSchema } from "../dto/interactions.dto";

describe("createInteractionSchema", () => {
  it("should accept valid interaction data", () => {
    const result = createInteractionSchema.safeParse({
      contactId: 1,
      direction: "outbound",
      channel: "email",
      status: "sent",
      content: "Hello, I'd like to discuss...",
    });
    expect(result.success).toBe(true);
  });

  it("should accept full data with optional fields", () => {
    const result = createInteractionSchema.safeParse({
      contactId: 1,
      campaignId: 5,
      direction: "inbound",
      channel: "email",
      status: "replied",
      subject: "Re: Press inquiry",
      content: "Thanks for reaching out!",
      occurredAt: "2026-04-22T10:00:00.000Z",
      providerMessageId: "msg_123",
      externalThreadId: "thread_456",
      metadata: { source: "gmail" },
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid direction", () => {
    const result = createInteractionSchema.safeParse({
      contactId: 1,
      direction: "unknown",
      channel: "email",
      status: "sent",
      content: "test",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid channel", () => {
    const result = createInteractionSchema.safeParse({
      contactId: 1,
      direction: "outbound",
      channel: "sms",
      status: "sent",
      content: "test",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid status", () => {
    const result = createInteractionSchema.safeParse({
      contactId: 1,
      direction: "outbound",
      channel: "email",
      status: "pending",
      content: "test",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty content", () => {
    const result = createInteractionSchema.safeParse({
      contactId: 1,
      direction: "outbound",
      channel: "email",
      status: "sent",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing contactId", () => {
    const result = createInteractionSchema.safeParse({
      direction: "outbound",
      channel: "email",
      status: "sent",
      content: "test",
    });
    expect(result.success).toBe(false);
  });

  it("should accept all valid direction values", () => {
    for (const direction of ["inbound", "outbound", "internal"]) {
      const result = createInteractionSchema.safeParse({
        contactId: 1,
        direction,
        channel: "email",
        status: "sent",
        content: "test",
      });
      expect(result.success).toBe(true);
    }
  });

  it("should accept all valid status values", () => {
    for (const status of ["draft", "sent", "delivered", "failed", "replied", "archived"]) {
      const result = createInteractionSchema.safeParse({
        contactId: 1,
        direction: "outbound",
        channel: "email",
        status,
        content: "test",
      });
      expect(result.success).toBe(true);
    }
  });
});
