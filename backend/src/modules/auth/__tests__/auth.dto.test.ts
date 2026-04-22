import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from "../dto/auth.dto";

describe("registerSchema", () => {
  it("should accept valid registration data", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "securepass123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "securepass123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty email", () => {
    const result = registerSchema.safeParse({
      email: "",
      password: "securepass123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password longer than 128 characters", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "a".repeat(129),
    });
    expect(result.success).toBe(false);
  });

  it("should accept password exactly 8 characters", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "12345678",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing fields", () => {
    expect(registerSchema.safeParse({}).success).toBe(false);
    expect(registerSchema.safeParse({ email: "a@b.com" }).success).toBe(false);
    expect(registerSchema.safeParse({ password: "12345678" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("should accept valid login data", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({
      email: "bad",
      password: "password",
    });
    expect(result.success).toBe(false);
  });
});

describe("refreshSchema", () => {
  it("should accept valid refresh token", () => {
    const result = refreshSchema.safeParse({
      refreshToken: "abc123tokenvalue",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty refresh token", () => {
    const result = refreshSchema.safeParse({ refreshToken: "" });
    expect(result.success).toBe(false);
  });

  it("should reject missing refresh token", () => {
    const result = refreshSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("logoutSchema", () => {
  it("should accept with refresh token", () => {
    const result = logoutSchema.safeParse({ refreshToken: "token123" });
    expect(result.success).toBe(true);
  });

  it("should accept without refresh token (optional)", () => {
    const result = logoutSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should reject empty string refresh token", () => {
    const result = logoutSchema.safeParse({ refreshToken: "" });
    expect(result.success).toBe(false);
  });
});
