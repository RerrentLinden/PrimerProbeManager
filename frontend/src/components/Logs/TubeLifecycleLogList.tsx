import { Link } from 'react-router-dom'
import type { TubeLifecycleLog } from '@/types'
import EmptyState from '@/components/common/EmptyState'
import { formatDateTime } from '@/utils/format'

const ACTION_STYLES: Record<TubeLifecycleLog['action'], {
  readonly badge: string
  readonly dot: string
  readonly border: string
}> = {
  created: {
    badge: 'bg-lab-accent/5 text-lab-accent border-lab-accent/30',
    dot: 'bg-lab-accent',
    border: 'border-lab-accent/30',
  },
  placed: {
    badge: 'bg-lab-success/5 text-lab-success border-lab-success/30',
    dot: 'bg-lab-success',
    border: 'border-lab-success/30',
  },
  moved: {
    badge: 'bg-lab-warning/5 text-lab-warning border-lab-warning/30',
    dot: 'bg-lab-warning',
    border: 'border-lab-warning/30',
  },
  used: {
    badge: 'bg-lab-danger/5 text-lab-danger border-lab-danger/30',
    dot: 'bg-lab-danger',
    border: 'border-lab-danger/30',
  },
  archived: {
    badge: 'bg-lab-surface text-lab-muted border-lab-border',
    dot: 'bg-lab-faint',
    border: 'border-lab-border',
  },
}

interface Props {
  readonly logs: TubeLifecycleLog[]
}

export default function TubeLifecycleLogList({ logs }: Props) {
  if (logs.length === 0) {
    return <EmptyState title="暂无日志" description="当前筛选范围内没有分管生命周期记录" />
  }

  const orderedLogs = [...logs].sort(compareLogsByNewest)

  return (
    <div className="space-y-4">
      {orderedLogs.map((log, index) => (
        <LogItem key={log.id} log={log} isLast={index === orderedLogs.length - 1} />
      ))}
    </div>
  )
}

function compareLogsByNewest(a: TubeLifecycleLog, b: TubeLifecycleLog): number {
  const timeDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  if (timeDiff !== 0) {
    return timeDiff
  }
  return b.id - a.id
}

function LogItem({
  log,
  isLast,
}: {
  readonly log: TubeLifecycleLog
  readonly isLast: boolean
}) {
  const style = ACTION_STYLES[log.action]
  return (
    <article className={`card p-4 border ${style.border}`}>
      <div className="flex gap-4">
        <div className="hidden sm:flex flex-col items-center">
          <span className={`mt-1 h-3 w-3 rounded-full ${style.dot}`} />
          {!isLast && <span className="mt-2 w-px flex-1 min-h-16 bg-lab-border" />}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${style.badge}`}>
                  {log.title}
                </span>
                <Link to={`/primers/${log.primer_id}`} className="font-medium text-lab-text hover:text-lab-accent truncate">
                  {log.primer_name}
                </Link>
                <span className={log.primer_type === 'probe' ? 'badge-probe' : 'badge-primer'}>
                  {log.primer_type === 'probe' ? '探针' : '引物'}
                </span>
              </div>
              <p className="text-sm text-lab-text leading-6">{log.description}</p>
            </div>
            <time className="text-xs text-lab-faint shrink-0">
              {formatDateTime(log.created_at)}
            </time>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-lab-muted">
            <MetaPill label="分管" value={formatTubeLabel(log.batch_number, log.tube_number)} />
            {log.from_position && <MetaPill label="原位置" value={log.from_position} />}
            {log.to_position && <MetaPill label="新位置" value={log.to_position} />}
            {log.volume_used_ul !== null && <MetaPill label="用量" value={`${log.volume_used_ul.toFixed(1)} uL`} />}
            {log.remaining_volume_ul !== null && <MetaPill label="剩余" value={`${log.remaining_volume_ul.toFixed(1)} uL`} />}
            {log.project_name && <MetaPill label="项目" value={log.project_name} />}
            {log.purpose && <MetaPill label="用途" value={log.purpose} />}
            {log.archive_reason && <MetaPill label="归档原因" value={log.archive_reason} />}
          </div>
        </div>
      </div>
    </article>
  )
}

function MetaPill({
  label,
  value,
}: {
  readonly label: string
  readonly value: string
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-lab-surface px-2.5 py-1">
      <span className="text-lab-faint">{label}</span>
      <span className="text-lab-muted">{value}</span>
    </span>
  )
}

function formatTubeLabel(batchNumber: string, tubeNumber: string | null): string {
  return tubeNumber ? `${batchNumber} #${tubeNumber}` : batchNumber
}
