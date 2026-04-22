import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { errorHandler } from "../errorHandler";
import { BadRequestError, NotFoundError, AppError } from "../../errors/AppError";

// Mock env to control NODE_ENV
vi.mock("../../../config/env", () => ({
  env: { NODE_ENV: "test" },
}));

function mockRes(): Partial<Response> & { _status?: number; _json?: unknown } {
  const res: Partial<Response> & { _status?: number; _json?: unknown } = {};
  res.status = vi.fn((code: number) => {
    res._status = code;
    return res as Response;
  });
  res.json = vi.fn((body: unknown) => {
    res._json = body;
    return res as Response;
  });
  return res;
}

describe("errorHandler", () => {
  const req = {} as Request;
  const next = vi.fn() as NextFunction;

  it("should handle BadRequestError with 400", () => {
    const err = new BadRequestError("Invalid input");
    const res = mockRes();

    errorHandler(err, req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res._json).toEqual({ error: "Invalid input" });
  });

  it("should handle NotFoundError with 404", () => {
    const err = new NotFoundError("Resource not found");
    const res = mockRes();

    errorHandler(err, req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res._json).toEqual({ error: "Resource not found" });
  });

  it("should handle unknown errors with 500", () => {
    const err = new Error("Something broke");
    const res = mockRes();

    // Suppress console.error in test output
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    errorHandler(err, req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    // In non-production mode, message is exposed
    expect((res._json as Record<string, unknown>).error).toBe("Something broke");

    consoleSpy.mockRestore();
  });

  it("should handle AppError subclasses correctly", () => {
    const err = new AppError("Custom error", 418, true);
    const res = mockRes();

    errorHandler(err, req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res._json).toEqual({ error: "Custom error" });
  });
});
