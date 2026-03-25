import client from './client'
import type { SearchResults } from '@/types/search'

export function globalSearch(q: string, type?: string) {
  return client.get<SearchResults>('/search', {
    params: { q, ...(type ? { type } : {}) },
  })
}
