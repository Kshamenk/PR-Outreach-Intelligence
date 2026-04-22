import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { validate } from "../validate";

function mockReq(body: unknown): Partial<Request> {
  return { body };
}

function mockRes(): Partial<Response> {
  return {};
}

describe("validate middleware", () => {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
  });

  it("should call next() on valid body and strip unknown fields", () => {
    const req = mockReq({ name: "John", email: "john@test.com", extra: "junk" }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    // Zod strips unknown fields after safeParse with strip (default)
    expect(req.body).toEqual({ name: "John", email: "john@test.com" });
  });

  it("should throw on missing required field", () => {
    const req = mockReq({ email: "john@test.com" }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    expect(() => validate(schema)(req, res, next)).toThrow();
    expect(next).not.toHaveBeenCalled();
  });

  it("should throw on invalid email", () => {
    const req = mockReq({ name: "John", email: "not-an-email" }) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    expect(() => validate(schema)(req, res, next)).toThrow();
    expect(next).not.toHaveBeenCalled();
  });

  it("should include field-level error messages", () => {
    const req = mockReq({}) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    try {
      validate(schema)(req, res, next);
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
      expect(err.message).toContain("name");
      expect(err.message).toContain("email");
    }
  });

  it("should throw on empty body", () => {
    const req = mockReq(undefined) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    expect(() => validate(schema)(req, res, next)).toThrow();
  });
});
