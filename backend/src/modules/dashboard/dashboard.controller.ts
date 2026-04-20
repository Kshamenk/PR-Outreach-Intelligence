import { Request, Response } from "express";
import * as dashboardService from "./dashboard.service";

export async function getStats(req: Request, res: Response): Promise<void> {
  const stats = await dashboardService.getStats(req.user!.userId);
  res.json(stats);
}

export async function getRecentActivity(req: Request, res: Response): Promise<void> {
  const activity = await dashboardService.getRecentActivity(req.user!.userId);
  res.json(activity);
}
