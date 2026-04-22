import { describe, it, expect } from "vitest";
import {
  createContactSchema,
  updateContactSchema,
} from "../dto/contacts.dto";

describe("createContactSchema", () => {
  it("should accept valid contact data", () => {
    const result = createContactSchema.safeParse({
      name: "John Doe",
      email: "john@press.com",
      outlet: "TechCrunch",
      topics: ["AI", "startups"],
    });
    expect(result.success).toBe(true);
  });

  it("should accept minimal data with defaults", () => {
    const result = createContactSchema.safeParse({
      name: "Jane",
      email: "jane@media.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.outlet).toBe("");
      expect(result.data.topics).toEqual([]);
    }
  });

  it("should reject missing name", () => {
    const result = createContactSchema.safeParse({
      email: "test@test.com",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const result = createContactSchema.safeParse({
      name: "John",
      email: "not-email",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty name", () => {
    const result = createContactSchema.safeParse({
      name: "",
      email: "test@test.com",
    });
    expect(result.success).toBe(false);
  });

  it("should reject name exceeding 255 chars", () => {
    const result = createContactSchema.safeParse({
      name: "a".repeat(256),
      email: "test@test.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateContactSchema", () => {
  it("should accept partial updates", () => {
    expect(updateContactSchema.safeParse({ name: "Updated" }).success).toBe(true);
    expect(updateContactSchema.safeParse({ email: "new@test.com" }).success).toBe(true);
    expect(updateContactSchema.safeParse({ topics: ["tech"] }).success).toBe(true);
  });

  it("should accept empty object (no fields to update)", () => {
    expect(updateContactSchema.safeParse({}).success).toBe(true);
  });

  it("should accept archivedAt as null (restore)", () => {
    const result = updateContactSchema.safeParse({ archivedAt: null });
    expect(result.success).toBe(true);
  });

  it("should accept archivedAt as datetime string", () => {
    const result = updateContactSchema.safeParse({
      archivedAt: "2026-04-22T12:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email in update", () => {
    const result = updateContactSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
  });
});
