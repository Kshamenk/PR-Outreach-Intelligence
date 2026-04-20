import { Request, Response } from "express";
import * as messagingService from "./messaging.service";

export async function send(req: Request, res: Response): Promise<void> {
  const result = await messagingService.send(req.user!.userId, req.body);
  res.status(201).json(result);
}
