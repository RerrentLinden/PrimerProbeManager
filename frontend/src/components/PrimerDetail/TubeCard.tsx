import { useState } from 'react'
import type { PrimerTube } from '@/types'
import { isLowVolume, formatDate, positionLabel } from '@/utils/format'
import VolumeBar from '@/components/common/VolumeBar'
import UsageTimeline from './UsageTimeline'

interface Props {
  readonly tube: PrimerTube
  readonly onRecordUsage: (tubeId: number) => void
}

export default function TubeCard({ tube, onRecordUsage }: Props) {
  const [expanded, setExpanded] = useState(false)
  const low = isLowVolume(tube.remaining_volume_ul, tube.initial_volume_ul)

  return (
    <div className={`card overflow-hidden transition-all ${low ? 'border-red-300 ring-2 ring-red-200' : ''}`}>
      <button
        type="button"
        className="w-full p-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {low && <span className="text-red-500">⚠️</span>}
            <span className="font-medium text-sm">{tube.batch_number}</span>
          </div>
          <div className="flex items-center gap-2">
            {tube.position && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {tube.position.box_name} {positionLabel(tube.position.row, tube.position.col)}
              </span>
            )}
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
          <span>定容: {formatDate(tube.dissolution_date)}</span>
          <span>状态: {tube.status === 'active' ? '活跃' : '已归档'}</span>
        </div>

        <VolumeBar remaining={tube.remaining_volume_ul} initial={tube.initial_volume_ul} />
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-700">用量记录</h4>
            <button
              type="button"
              className="btn-primary text-xs py-1 px-3"
              onClick={() => onRecordUsage(tube.id)}
            >
              记录用量
            </button>
          </div>
          <UsageTimeline tubeId={tube.id} />
        </div>
      )}
    </div>
  )
}
