import { useCallback, useEffect, useState } from 'react'
import { updatePrimer } from '@/api/primers'
import type { ProjectPrimer } from '@/types'
import {
  DesktopPrimerTable,
  MobilePrimerCards,
} from '@/components/Project/ProjectPrimerOverviewRows'

interface Props {
  readonly primers: ProjectPrimer[]
  readonly removingId: number | null
  readonly onRemove: (primerId: number) => void
  readonly onRefresh: () => void
}

export default function ProjectPrimerOverview({
  primers,
  removingId,
  onRemove,
  onRefresh,
}: Props) {
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [savingId, setSavingId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<number, string>>({})

  useEffect(() => {
    setDrafts(buildDrafts(primers))
  }, [primers])

  const setDraft = useCallback((primerId: number, value: string) => {
    setDrafts((prev) => ({ ...prev, [primerId]: value }))
    setErrors((prev) => ({ ...prev, [primerId]: '' }))
  }, [])

  const handleCommitThreshold = useCallback(async (primer: ProjectPrimer) => {
    const parsedValue = parseThreshold(drafts[primer.id] ?? '')
    if (parsedValue === 'invalid') {
      setErrors((prev) => ({ ...prev, [primer.id]: '请输入大于或等于 0 的数字' }))
      return
    }
    if (isSameThreshold(primer.low_volume_alert_threshold_ul, parsedValue)) return

    setSavingId(primer.id)
    setErrors((prev) => ({ ...prev, [primer.id]: '' }))
    try {
      await updatePrimer(primer.id, {
        low_volume_alert_threshold_ul: parsedValue,
      })
      onRefresh()
    } catch (err: unknown) {
      setErrors((prev) => ({ ...prev, [primer.id]: extractError(err, '阈值保存失败') }))
    }
    setSavingId(null)
  }, [drafts, onRefresh])

  const rowProps = {
    removingId,
    onRemove,
    onDraftChange: setDraft,
    onCommitThreshold: handleCommitThreshold,
    drafts,
    errors,
    savingId,
  }

  return (
    <>
      <DesktopPrimerTable primers={primers} {...rowProps} />
      <MobilePrimerCards primers={primers} {...rowProps} />
    </>
  )
}

function buildDrafts(primers: ProjectPrimer[]): Record<number, string> {
  return Object.fromEntries(
    primers.map((primer) => [
      primer.id,
      primer.low_volume_alert_threshold_ul?.toString() ?? '',
    ]),
  )
}

function parseThreshold(rawValue: string): number | null | 'invalid' {
  const trimmed = rawValue.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed < 0) return 'invalid'
  return parsed
}

function isSameThreshold(current: number | null, next: number | null): boolean {
  return current === next
}

function extractError(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? fallback
}
