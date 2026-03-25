import client from './client'
import type { Primer, PrimerCreate, PaginatedResponse } from '@/types'

export interface PrimerQuery {
  readonly search?: string
  readonly search_field?: 'name' | 'sequence' | 'modification'
  readonly type?: 'primer' | 'probe'
  readonly mod_5?: string
  readonly mod_3?: string
  readonly project_id?: number
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

export function fetchModifications() {
  return client.get<{ five_prime: string[]; three_prime: string[] }>('/primers/modifications')
}
