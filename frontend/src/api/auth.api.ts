import { post, get } from './client'
import type {
  RegisterDTO,
  LoginDTO,
  AuthResponseDTO,
  MeResponseDTO,
} from '@pr-outreach/shared-types'

export function register(dto: RegisterDTO): Promise<AuthResponseDTO> {
  return post<AuthResponseDTO>('/auth/register', dto, true)
}

export function login(dto: LoginDTO): Promise<AuthResponseDTO> {
  return post<AuthResponseDTO>('/auth/login', dto, true)
}

export function refresh(refreshToken: string): Promise<AuthResponseDTO> {
  return post<AuthResponseDTO>('/auth/refresh', { refreshToken }, true)
}

export function logout(refreshToken: string): Promise<void> {
  return post('/auth/logout', { refreshToken })
}

export function logoutAll(): Promise<void> {
  return post('/auth/logout-all')
}

export function getMe(): Promise<MeResponseDTO> {
  return get<MeResponseDTO>('/auth/me')
}
