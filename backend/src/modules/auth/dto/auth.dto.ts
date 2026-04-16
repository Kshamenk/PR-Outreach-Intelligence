import { z } from "zod";

export type {
  AuthResponseDTO,
  MeResponseDTO,
  RegisterDTO,
  LoginDTO,
  RefreshDTO,
  LogoutDTO,
} from "@pr-outreach/shared-types";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});
