import { post } from './client'
import type { SendEmailDTO, SendEmailResponseDTO } from '@pr-outreach/shared-types'

export function sendEmail(dto: SendEmailDTO): Promise<SendEmailResponseDTO> {
  return post<SendEmailResponseDTO>('/messaging/send', dto)
}
