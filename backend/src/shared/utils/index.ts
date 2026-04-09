import { BadRequestError } from "../errors/AppError";

export function parseId(value: string | string[]): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestError("Invalid ID parameter");
  }
  return id;
}

export function pickFields<T extends Record<string, unknown>>(
  source: T,
  allowed: readonly string[]
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in source && source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result as Partial<T>;
}
