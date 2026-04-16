import { get, post } from './client'
import type {
  CreateInteractionDTO,
  InteractionResponseDTO,
  PaginatedResult,
} from '@pr-outreach/shared-types'

export function listInteractions(
  params: { contactId?: number; campaignId?: number; limit?: number; offset?: number } = {},
): Promise<PaginatedResult<InteractionResponseDTO>> {
  const query = new URLSearchParams()
  if (params.contactId) query.set('contactId', String(params.contactId))
  if (params.campaignId) query.set('campaignId', String(params.campaignId))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.offset) query.set('offset', String(params.offset))
  const qs = query.toString()
  return get(`/interactions${qs ? `?${qs}` : ''}`)
}

export function getInteraction(id: number): Promise<InteractionResponseDTO> {
  return get(`/interactions/${id}`)
}

export function createInteraction(dto: CreateInteractionDTO): Promise<InteractionResponseDTO> {
  return post('/interactions', dto)
}
