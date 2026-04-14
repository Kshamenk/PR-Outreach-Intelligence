import { Request, Response } from "express";
import * as authService from "./auth.service";

export async function register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(
        req.body,
        req.headers["user-agent"] ?? null,
        req.ip ?? null
    );
    res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(
        req.body,
        req.headers["user-agent"] ?? null,
        req.ip ?? null
    );
    res.json(result);
}

export async function refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    const result = await authService.refresh(
        refreshToken,
        req.headers["user-agent"] ?? null,
        req.ip ?? null
    );
    res.json(result);
}

export async function logout(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await authService.logout(refreshToken);
    }
    res.status(204).send();
}

export async function logoutAll(req: Request, res: Response): Promise<void> {
    await authService.logoutAll(req.user!.userId);
    res.status(204).send();
}

export async function me(req: Request, res: Response): Promise<void> {
    const result = await authService.me(req.user!.userId);
    res.json(result);
}
