import { get, post, put, del } from './client'
import type {
  CreateContactDTO,
  UpdateContactDTO,
  ContactResponseDTO,
  ContactListItemDTO,
  PaginatedResult,
} from '@pr-outreach/shared-types'

export function listContacts(
  limit = 50,
  offset = 0,
): Promise<PaginatedResult<ContactListItemDTO>> {
  return get(`/contacts?limit=${limit}&offset=${offset}`)
}

export function getContact(id: number): Promise<ContactResponseDTO> {
  return get(`/contacts/${id}`)
}

export function createContact(dto: CreateContactDTO): Promise<ContactResponseDTO> {
  return post('/contacts', dto)
}

export function updateContact(id: number, dto: UpdateContactDTO): Promise<ContactResponseDTO> {
  return put(`/contacts/${id}`, dto)
}

export function deleteContact(id: number): Promise<void> {
  return del(`/contacts/${id}`)
}
