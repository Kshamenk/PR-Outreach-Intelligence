import { Request, Response } from "express";
import * as interactionsService from "./interactions.service";
import { parseId } from "../../shared/utils";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function parsePagination(query: Record<string, unknown>): { limit: number; offset: number } {
  let limit = Number(query.limit) || DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  if (limit < 1) limit = DEFAULT_LIMIT;
  let offset = Number(query.offset) || 0;
  if (offset < 0) offset = 0;
  return { limit, offset };
}

export async function create(req: Request, res: Response): Promise<void> {
  const result = await interactionsService.createInteraction(req.user!.userId, req.body);
  res.status(201).json(result);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const interactionId = parseId(req.params.id);
  const result = await interactionsService.getInteraction(req.user!.userId, interactionId);
  res.json(result);
}

export async function list(req: Request, res: Response): Promise<void> {
  const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
  const contactId = req.query.contactId ? parseId(req.query.contactId as string) : null;
  const campaignId = req.query.campaignId ? parseId(req.query.campaignId as string) : null;

  let result;
  if (contactId) {
    result = await interactionsService.listByContact(req.user!.userId, contactId, limit, offset);
  } else if (campaignId) {
    result = await interactionsService.listByCampaign(req.user!.userId, campaignId, limit, offset);
  } else {
    result = await interactionsService.listAll(req.user!.userId, limit, offset);
  }

  res.json(result);
}
