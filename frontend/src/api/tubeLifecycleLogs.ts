import client from './client'
import type { TubeLifecycleLog, TubeLifecycleLogFilter } from '@/types'

export function fetchTubeLifecycleLogs(params?: TubeLifecycleLogFilter) {
  return client.get<TubeLifecycleLog[]>('/tube-lifecycle-logs', { params })
}

export function exportTubeLifecycleLogs(params?: TubeLifecycleLogFilter) {
  return client.get('/tube-lifecycle-logs/export', {
    params,
    responseType: 'blob',
  })
}
