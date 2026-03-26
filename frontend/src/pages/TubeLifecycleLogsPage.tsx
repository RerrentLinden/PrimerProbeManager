import { useCallback, useEffect, useMemo, useState } from 'react'
import { exportTubeLifecycleLogs, fetchTubeLifecycleLogs } from '@/api/tubeLifecycleLogs'
import type { TubeLifecycleLog, TubeLifecycleLogFilter } from '@/types'
import TubeLifecycleLogList from '@/components/Logs/TubeLifecycleLogList'
import LoadingSpinner from '@/components/common/LoadingSpinner'

type FilterMode = '24h' | '7d' | '30d' | 'custom'

const FILTER_OPTIONS: { readonly value: FilterMode; readonly label: string }[] = [
  { value: '24h', label: '24 小时' },
  { value: '7d', label: '7 天' },
  { value: '30d', label: '1 个月' },
  { value: 'custom', label: '指定日期' },
]

export default function TubeLifecycleLogsPage() {
  const [logs, setLogs] = useState<TubeLifecycleLog[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<FilterMode>('30d')
  const [range, setRange] = useState({ start: '', end: '' })
  const [appliedFilter, setAppliedFilter] = useState<TubeLifecycleLogFilter>({ preset: '30d' })

  const activeSummary = useMemo(() => {
    if (appliedFilter.start_date && appliedFilter.end_date) {
      return `${appliedFilter.start_date} 至 ${appliedFilter.end_date}`
    }
    if (appliedFilter.preset === '24h') return '近 24 小时'
    if (appliedFilter.preset === '7d') return '近 7 天'
    return '近 30 天'
  }, [appliedFilter])

  const loadLogs = useCallback(async (filter: TubeLifecycleLogFilter) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await fetchTubeLifecycleLogs(filter)
      setLogs(data)
    } catch (err: unknown) {
      setError(extractError(err, '日志加载失败'))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadLogs(appliedFilter)
  }, [appliedFilter, loadLogs])

  const applyPreset = useCallback((nextMode: Exclude<FilterMode, 'custom'>) => {
    setMode(nextMode)
    setError('')
    setAppliedFilter({ preset: nextMode })
  }, [])

  const handleRangeChange = useCallback((key: 'start' | 'end', value: string) => {
    setMode('custom')
    setRange((prev) => ({ ...prev, [key]: value }))
    setError('')
  }, [])

  const handleSearch = useCallback(() => {
    const nextFilter = resolveCustomFilter(range.start, range.end)
    if (!nextFilter) {
      setError('请选择完整且有效的日期范围')
      return
    }
    setAppliedFilter(nextFilter)
  }, [range])

  const handleExport = useCallback(async () => {
    const exportFilter = mode === 'custom'
      ? resolveCustomFilter(range.start, range.end)
      : appliedFilter
    if (!exportFilter) {
      setError('请选择完整且有效的日期范围')
      return
    }
    setExporting(true)
    try {
      const response = await exportTubeLifecycleLogs(exportFilter)
      const filename = parseFilename(response.headers['content-disposition'])
      downloadBlob(response.data, filename)
    } catch (err: unknown) {
      setError(extractError(err, '日志导出失败'))
    }
    setExporting(false)
  }, [appliedFilter, mode, range.end, range.start])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-lab-text">日志记录</h1>
          <p className="text-sm text-lab-muted">最新日志置顶，向下可查看更早的引探分管全生命周期记录</p>
        </div>
        <button
          type="button"
          className="btn-primary text-sm shrink-0"
          disabled={loading || exporting}
          onClick={handleExport}
        >
          {exporting ? '导出中...' : '导出 TXT'}
        </button>
      </div>

      <div className="card p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => option.value === 'custom' ? setMode('custom') : applyPreset(option.value)}
              className={filterButtonClass(mode === option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 flex-1">
            <DateField label="开始日期" value={range.start} onChange={(value) => handleRangeChange('start', value)} />
            <DateField label="结束日期" value={range.end} onChange={(value) => handleRangeChange('end', value)} />
          </div>
          <button type="button" className="btn-secondary text-sm shrink-0" onClick={handleSearch}>
            查询
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-lab-muted">
          <span>当前范围:</span>
          <span className="inline-flex items-center rounded-full bg-lab-surface px-3 py-1 text-lab-text">
            {activeSummary}
          </span>
          <span className="inline-flex items-center rounded-full bg-lab-accent/10 px-3 py-1 text-lab-accent">
            共 {logs.length} 条
          </span>
        </div>

        {error && <p className="text-sm text-lab-danger bg-lab-danger/10 rounded-lg px-3 py-2">{error}</p>}
      </div>

      {loading ? <LoadingSpinner /> : <TubeLifecycleLogList logs={logs} />}
    </div>
  )
}

function DateField({
  label,
  value,
  onChange,
}: {
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-lab-muted mb-1">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-field"
      />
    </div>
  )
}

function filterButtonClass(active: boolean): string {
  const base = 'rounded-full border px-3 py-1.5 text-sm transition-colors'
  return active
    ? `${base} border-lab-accent bg-lab-accent/10 text-lab-accent`
    : `${base} border-lab-border bg-lab-surface text-lab-muted hover:border-lab-border-light hover:text-lab-text`
}

function resolveCustomFilter(start: string, end: string): TubeLifecycleLogFilter | null {
  if (!start || !end) return null
  if (start > end) return null
  return {
    start_date: start,
    end_date: end,
  }
}

function extractError(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? fallback
}

function parseFilename(contentDisposition?: string): string {
  const match = contentDisposition?.match(/filename=\"?([^"]+)\"?/)
  return match?.[1] ?? 'tube-lifecycle-logs.txt'
}

function downloadBlob(data: BlobPart, filename: string) {
  const blob = new Blob([data], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
