import { Request, Response } from "express";
import * as contactsService from "./contacts.service";
import { parseId } from "../../shared/utils";

export async function create(req: Request, res: Response): Promise<void> {
  const result = await contactsService.createContact(req.user!.userId, req.body);
  res.status(201).json(result);
}

export async function list(req: Request, res: Response): Promise<void> {
  const result = await contactsService.listContacts(req.user!.userId);
  res.json(result);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const contactId = parseId(req.params.id);
  const result = await contactsService.getContact(req.user!.userId, contactId);
  res.json(result);
}

export async function update(req: Request, res: Response): Promise<void> {
  const contactId = parseId(req.params.id);
  const result = await contactsService.updateContact(req.user!.userId, contactId, req.body);
  res.json(result);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const contactId = parseId(req.params.id);
  await contactsService.deleteContact(req.user!.userId, contactId);
  res.status(204).send();
}
