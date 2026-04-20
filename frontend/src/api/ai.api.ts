import { get, post, patch } from './client'
import type {
  GenerateOutreachDTO,
  GenerateOutreachResponseDTO,
  AISuggestionDTO,
  PaginatedResult,
} from '@pr-outreach/shared-types'

export function generateOutreach(dto: GenerateOutreachDTO): Promise<GenerateOutreachResponseDTO> {
  return post<GenerateOutreachResponseDTO>('/ai/generate', dto)
}

export function listSuggestions(
  limit = 20,
  offset = 0,
): Promise<PaginatedResult<AISuggestionDTO>> {
  return get<PaginatedResult<AISuggestionDTO>>(`/ai/suggestions?limit=${limit}&offset=${offset}`)
}

export function getSuggestion(id: number): Promise<AISuggestionDTO> {
  return get<AISuggestionDTO>(`/ai/suggestions/${id}`)
}

export function acceptSuggestion(id: number): Promise<AISuggestionDTO> {
  return patch<AISuggestionDTO>(`/ai/suggestions/${id}/accept`)
}

export function rejectSuggestion(id: number, reason?: string): Promise<AISuggestionDTO> {
  return patch<AISuggestionDTO>(`/ai/suggestions/${id}/reject`, reason ? { reason } : undefined)
}
