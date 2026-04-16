// ── Request ──

export interface RegisterDTO {
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RefreshDTO {
  refreshToken: string;
}

export interface LogoutDTO {
  refreshToken?: string;
}

// ── Response ──

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
