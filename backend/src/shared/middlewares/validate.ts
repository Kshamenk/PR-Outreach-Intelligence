import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { BadRequestError } from "../errors/AppError";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      throw new BadRequestError(message);
    }
    req.body = result.data;
    next();
  };
}
