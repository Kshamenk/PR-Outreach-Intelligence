import { Request, Response } from "express";
import * as campaignsService from "./campaigns.service";
import { parseId } from "../../shared/utils";

export async function create(req: Request, res: Response): Promise<void> {
  const result = await campaignsService.createCampaign(req.user!.userId, req.body);
  res.status(201).json(result);
}

export async function list(req: Request, res: Response): Promise<void> {
  const result = await campaignsService.listCampaigns(req.user!.userId);
  res.json(result);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const campaignId = parseId(req.params.id);
  const result = await campaignsService.getCampaign(req.user!.userId, campaignId);
  res.json(result);
}

export async function update(req: Request, res: Response): Promise<void> {
  const campaignId = parseId(req.params.id);
  const result = await campaignsService.updateCampaign(req.user!.userId, campaignId, req.body);
  res.json(result);
}

export async function addContacts(req: Request, res: Response): Promise<void> {
  const campaignId = parseId(req.params.id);
  const result = await campaignsService.addContacts(req.user!.userId, campaignId, req.body);
  res.status(201).json(result);
}

export async function removeContact(req: Request, res: Response): Promise<void> {
  const campaignId = parseId(req.params.id);
  const contactId = parseId(req.params.contactId);
  await campaignsService.removeContact(req.user!.userId, campaignId, contactId);
  res.status(204).send();
}

export async function getParticipants(req: Request, res: Response): Promise<void> {
  const campaignId = parseId(req.params.id);
  const result = await campaignsService.getParticipants(req.user!.userId, campaignId);
  res.json(result);
}
