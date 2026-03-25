import client from './client'
import type { Stats, LowVolumeAlert } from '@/types'

export function fetchStats() {
  return client.get<Stats>('/stats')
}

export function fetchLowVolumeAlerts() {
  return client.get<LowVolumeAlert[]>('/alerts/low-volume')
}
