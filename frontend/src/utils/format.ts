import { LOW_VOLUME_THRESHOLD, ROW_LABELS, SEQUENCE_DISPLAY_LENGTH } from './constants'

export function isLowVolume(remaining: number, initial: number): boolean {
  return initial > 0 && remaining < initial * LOW_VOLUME_THRESHOLD
}

export function volumePercent(remaining: number, initial: number): number {
  if (initial <= 0) return 0
  return Math.min(100, Math.max(0, (remaining / initial) * 100))
}

export function truncateSequence(seq: string): string {
  if (seq.length <= SEQUENCE_DISPLAY_LENGTH) return seq
  return seq.slice(0, SEQUENCE_DISPLAY_LENGTH) + '...'
}

export function formatGcPercent(gc: number | null): string {
  if (gc === null) return '-'
  return `${(gc * 100).toFixed(1)}%`
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

export function rowLabel(row: number): string {
  return ROW_LABELS[row] ?? String(row)
}

export function positionLabel(row: number, col: number): string {
  return `${rowLabel(row)}${col + 1}`
}
