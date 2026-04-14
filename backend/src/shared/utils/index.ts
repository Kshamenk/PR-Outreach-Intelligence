import { BadRequestError } from "../errors/AppError";

export function parseId(value: string | string[]): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestError("Invalid ID parameter");
  }
  return id;
}
