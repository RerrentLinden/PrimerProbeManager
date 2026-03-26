import { useState, useEffect } from 'react'
import { fetchUsageLogs } from '@/api/tubes'
import type { UsageLog } from '@/types'
import { formatDate } from '@/utils/format'

interface Props {
  readonly tubeId: number
}

export default function UsageTimeline({ tubeId }: Props) {
  const [logs, setLogs] = useState<UsageLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsageLogs(tubeId)
      .then(({ data }) => setLogs(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tubeId])

  if (loading) {
    return <p className="text-xs text-lab-faint py-2">加载中...</p>
  }

  if (logs.length === 0) {
    return <p className="text-xs text-lab-faint py-2">暂无用量记录</p>
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-lab-accent mt-1.5 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-lab-muted">{formatDate(log.usage_date)}</span>
              <span className="font-medium text-lab-danger">-{log.volume_used_ul} uL</span>
            </div>
            <div className="flex gap-2 mt-0.5 text-lab-faint">
              {log.purpose && <span>{log.purpose}</span>}
              {log.project && <span>| {log.project}</span>}
              <span className="ml-auto tabular-nums">剩余 {log.remaining_after_ul} uL</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
