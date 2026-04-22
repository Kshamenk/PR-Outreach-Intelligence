import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { authenticate } from "../authenticate";

// Mock the env module to avoid loading .env file in isolated unit tests
vi.mock("../../../config/env", () => ({
  env: {
    JWT_SECRET: "test-secret-key-minimum-16-chars",
  },
}));

function mockReq(authHeader?: string): Partial<Request> {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  };
}

function mockRes(): Partial<Response> {
  return {};
}

describe("authenticate middleware", () => {
  const secret = "test-secret-key-minimum-16-chars";

  it("should set req.user for a valid JWT", () => {
    const token = jwt.sign({ userId: 1, email: "test@test.com" }, secret, {
      expiresIn: "15m",
    });

    const req = mockReq(`Bearer ${token}`) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBeDefined();
    expect(req.user!.userId).toBe(1);
    expect(req.user!.email).toBe("test@test.com");
  });

  it("should throw when no Authorization header", () => {
    const req = mockReq() as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    expect(() => authenticate(req, res, next)).toThrow("Missing or invalid authorization header");
    expect(next).not.toHaveBeenCalled();
  });

  it("should throw when header doesn't start with Bearer", () => {
    const req = mockReq("Basic abc123") as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    expect(() => authenticate(req, res, next)).toThrow("Missing or invalid authorization header");
  });

  it("should throw for an expired token", () => {
    const token = jwt.sign({ userId: 1, email: "test@test.com" }, secret, {
      expiresIn: "-1s",
    });

    const req = mockReq(`Bearer ${token}`) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    expect(() => authenticate(req, res, next)).toThrow("Invalid or expired token");
  });

  it("should throw for a token signed with wrong secret", () => {
    const token = jwt.sign({ userId: 1, email: "test@test.com" }, "wrong-secret-key-16-chars");

    const req = mockReq(`Bearer ${token}`) as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    expect(() => authenticate(req, res, next)).toThrow("Invalid or expired token");
  });

  it("should throw for malformed token", () => {
    const req = mockReq("Bearer not.a.valid.jwt.token") as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    expect(() => authenticate(req, res, next)).toThrow("Invalid or expired token");
  });

  it("should throw when Bearer token is empty string", () => {
    const req = mockReq("Bearer ") as Request;
    const res = mockRes() as Response;
    const next = vi.fn() as NextFunction;

    expect(() => authenticate(req, res, next)).toThrow("Invalid or expired token");
  });
});
