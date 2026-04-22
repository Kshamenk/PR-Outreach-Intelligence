import { describe, it, expect } from "vitest";
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "../AppError";

describe("AppError", () => {
  it("should set message and statusCode", () => {
    const error = new AppError("test error", 418);
    expect(error.message).toBe("test error");
    expect(error.statusCode).toBe(418);
    expect(error.isOperational).toBe(true);
  });

  it("should allow non-operational errors", () => {
    const error = new AppError("fatal", 500, false);
    expect(error.isOperational).toBe(false);
  });

  it("should be an instance of Error", () => {
    const error = new AppError("test", 400);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });
});

describe("BadRequestError", () => {
  it("should default to 400 and default message", () => {
    const error = new BadRequestError();
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Bad request");
  });

  it("should accept custom message", () => {
    const error = new BadRequestError("Invalid field");
    expect(error.message).toBe("Invalid field");
    expect(error.statusCode).toBe(400);
  });
});

describe("UnauthorizedError", () => {
  it("should default to 401", () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Unauthorized");
  });
});

describe("ForbiddenError", () => {
  it("should default to 403", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe("Forbidden");
  });
});

describe("NotFoundError", () => {
  it("should default to 404", () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Not found");
  });
});

describe("ConflictError", () => {
  it("should default to 409", () => {
    const error = new ConflictError();
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe("Conflict");
  });
});
