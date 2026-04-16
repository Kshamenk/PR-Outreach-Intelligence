import { get, post, put, del } from './client'
import type {
  CreateCampaignDTO,
  UpdateCampaignDTO,
  AddContactsToCampaignDTO,
  CampaignResponseDTO,
  CampaignParticipantDTO,
  PaginatedResult,
} from '@pr-outreach/shared-types'

export function listCampaigns(
  limit = 50,
  offset = 0,
): Promise<PaginatedResult<CampaignResponseDTO>> {
  return get(`/campaigns?limit=${limit}&offset=${offset}`)
}

export function getCampaign(id: number): Promise<CampaignResponseDTO> {
  return get(`/campaigns/${id}`)
}

export function createCampaign(dto: CreateCampaignDTO): Promise<CampaignResponseDTO> {
  return post('/campaigns', dto)
}

export function updateCampaign(id: number, dto: UpdateCampaignDTO): Promise<CampaignResponseDTO> {
  return put(`/campaigns/${id}`, dto)
}

export function deleteCampaign(id: number): Promise<void> {
  return del(`/campaigns/${id}`)
}

export function addContactsToCampaign(
  campaignId: number,
  dto: AddContactsToCampaignDTO,
): Promise<{ added: number }> {
  return post(`/campaigns/${campaignId}/contacts`, dto)
}

export function removeContactFromCampaign(
  campaignId: number,
  contactId: number,
): Promise<void> {
  return del(`/campaigns/${campaignId}/contacts/${contactId}`)
}

export function getCampaignParticipants(
  campaignId: number,
): Promise<CampaignParticipantDTO[]> {
  return get(`/campaigns/${campaignId}/contacts`)
}
