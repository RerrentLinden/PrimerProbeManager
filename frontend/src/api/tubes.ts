import client from './client'
import type { PrimerTube, TubeCreate, UsageLog, UsageLogCreate } from '@/types'

export function fetchTubes(primerId: number, status?: string) {
  return client.get<PrimerTube[]>(`/primers/${primerId}/tubes`, {
    params: status ? { status } : undefined,
  })
}

export function createTube(primerId: number, data: TubeCreate) {
  return client.post<PrimerTube>(`/primers/${primerId}/tubes`, data)
}

export function updateTube(id: number, data: Partial<TubeCreate>) {
  return client.put<PrimerTube>(`/tubes/${id}`, data)
}

export function archiveTube(id: number, reason: string) {
  return client.put(`/tubes/${id}/archive`, { reason })
}

export function moveTube(id: number, box_id: number, row: number, col: number) {
  return client.put(`/tubes/${id}/move`, { box_id, row, col })
}

export function fetchUsageLogs(tubeId: number) {
  return client.get<UsageLog[]>(`/tubes/${tubeId}/usage-logs`)
}

export function createUsageLog(tubeId: number, data: UsageLogCreate) {
  return client.post<UsageLog>(`/tubes/${tubeId}/usage-logs`, data)
}
