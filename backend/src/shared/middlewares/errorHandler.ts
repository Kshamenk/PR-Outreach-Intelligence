import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { env } from "../../config/env";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error("Unhandled error:", err);

  const isDev = env.NODE_ENV !== "production";
  res.status(500).json({
    error: isDev ? err.message : "Internal server error",
    ...(isDev && { stack: err.stack, name: err.constructor.name }),
  });
}
