import { get } from './client'
import type { DashboardStatsDTO, RecentActivityDTO } from '@pr-outreach/shared-types'

export function getStats(): Promise<DashboardStatsDTO> {
  return get<DashboardStatsDTO>('/dashboard/stats')
}

export function getRecentActivity(): Promise<RecentActivityDTO[]> {
  return get<RecentActivityDTO[]>('/dashboard/activity')
}
