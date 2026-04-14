import { z } from "zod";

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

export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
export type RefreshDTO = z.infer<typeof refreshSchema>;
export type LogoutDTO = z.infer<typeof logoutSchema>;

export interface AuthResponseDTO {
  user: { id: number; email: string };
  accessToken: string;
  refreshToken: string;
}

export interface MeResponseDTO {
  id: number;
  email: string;
  createdAt: string;
}
