import client from './client'
import type { Primer, PrimerCreate, PaginatedResponse } from '@/types'

interface PrimerQuery {
  readonly search?: string
  readonly type?: 'primer' | 'probe'
  readonly page?: number
  readonly page_size?: number
}

export function fetchPrimers(params?: PrimerQuery) {
  return client.get<PaginatedResponse<Primer>>('/primers', { params })
}

export function fetchPrimer(id: number) {
  return client.get<Primer>(`/primers/${id}`)
}

export function createPrimer(data: PrimerCreate) {
  return client.post<Primer>('/primers', data)
}

export function updatePrimer(id: number, data: Partial<PrimerCreate>) {
  return client.put<Primer>(`/primers/${id}`, data)
}

export function deletePrimer(id: number) {
  return client.delete(`/primers/${id}`)
}
