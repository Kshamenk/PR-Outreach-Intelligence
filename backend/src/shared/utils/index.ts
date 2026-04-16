import { BadRequestError } from "../errors/AppError";

export function parseId(value: string | string[]): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestError("Invalid ID parameter");
  }
  return id;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export function parsePagination(query: Record<string, unknown>): { limit: number; offset: number } {
  let limit = Number(query.limit) || DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  if (limit < 1) limit = DEFAULT_LIMIT;
  let offset = Number(query.offset) || 0;
  if (offset < 0) offset = 0;
  return { limit, offset };
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
