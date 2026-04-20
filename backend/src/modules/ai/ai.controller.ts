import { Request, Response } from "express";
import * as aiService from "./ai.service";
import { parseId, parsePagination } from "../../shared/utils";

export async function generate(req: Request, res: Response): Promise<void> {
  const result = await aiService.generate(req.user!.userId, req.body);
  res.status(201).json(result);
}

export async function list(req: Request, res: Response): Promise<void> {
  const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
  const result = await aiService.listSuggestions(req.user!.userId, limit, offset);
  res.json(result);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const suggestionId = parseId(req.params.id);
  const result = await aiService.getSuggestion(req.user!.userId, suggestionId);
  res.json(result);
}

export async function accept(req: Request, res: Response): Promise<void> {
  const suggestionId = parseId(req.params.id);
  const result = await aiService.acceptSuggestion(req.user!.userId, suggestionId);
  res.json(result);
}

export async function reject(req: Request, res: Response): Promise<void> {
  const suggestionId = parseId(req.params.id);
  const result = await aiService.rejectSuggestion(
    req.user!.userId,
    suggestionId,
    req.body?.reason
  );
  res.json(result);
}
