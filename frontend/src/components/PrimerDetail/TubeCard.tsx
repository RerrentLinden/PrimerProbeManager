import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PrimerTube } from '@/types'
import { isLowVolume, formatDate, positionLabel } from '@/utils/format'
import { archiveTube } from '@/api/tubes'
import VolumeBar from '@/components/common/VolumeBar'
import UsageTimeline from './UsageTimeline'
import Modal from '@/components/common/Modal'

interface Props {
  readonly tube: PrimerTube
  readonly onRecordUsage: (tubeId: number) => void
  readonly onEdit?: (tubeId: number) => void
  readonly onAssignPosition?: (tubeId: number) => void
  readonly onArchived?: () => void
}

export default function TubeCard({ tube, onRecordUsage, onEdit, onAssignPosition, onArchived }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const navigate = useNavigate()
  const low = isLowVolume(tube.remaining_volume_ul, tube.initial_volume_ul)
  const pos = tube.position
  const isActive = tube.status === 'active'

  const handlePositionClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!pos) return
    navigate(`/storage?box=${pos.box_id}&highlight=${encodeURIComponent(tube.primer_name ?? tube.batch_number)}`)
  }

  return (
    <div className={`card overflow-hidden transition-all ${low ? 'border-lab-danger/50 ring-1 ring-lab-danger/30' : ''} ${!isActive ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3 p-4">
        <button type="button" className="flex-1 text-left min-w-0" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2 mb-1">
            {low && <span className="text-lab-danger text-sm">⚠️</span>}
            <span className="font-medium text-sm text-lab-text">{tube.batch_number}</span>
            {tube.tube_number && (
              <span className="text-xs bg-lab-accent/10 text-lab-accent px-1.5 py-0.5 rounded">#{tube.tube_number}</span>
            )}
            {!isActive && <span className="text-xs bg-lab-raised text-lab-faint px-1.5 py-0.5 rounded">已归档</span>}
            <svg className={`w-3.5 h-3.5 text-lab-faint transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-lab-muted mb-2">
            <span>定容: {formatDate(tube.dissolution_date)}</span>
          </div>
          <VolumeBar remaining={tube.remaining_volume_ul} initial={tube.initial_volume_ul} />
        </button>

        <div className="flex flex-col gap-1.5 shrink-0 pt-0.5">
          {isActive && onEdit && (
            <button type="button" className="btn-secondary text-xs py-1 px-2.5" onClick={() => onEdit(tube.id)}>编辑</button>
          )}
          {isActive && (
            <button type="button" className="btn-primary text-xs py-1 px-2.5" onClick={() => onRecordUsage(tube.id)}>用量</button>
          )}
          {isActive && (
            <button type="button" className="btn-danger text-xs py-1 px-2.5" onClick={() => setShowArchive(true)}>归档</button>
          )}
        </div>
      </div>

      {/* Position bar */}
      <div className="px-4 pb-3 -mt-1">
        {pos ? (
          <button type="button" onClick={handlePositionClick} className="inline-flex items-center gap-1.5 text-xs bg-lab-accent/10 text-lab-accent border border-lab-accent/20 px-2.5 py-1 rounded-lg hover:bg-lab-accent/20 transition-colors" title="点击跳转到存放管理">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {pos.storage_location && <><span>{pos.storage_location}</span><span className="text-lab-accent/50">/</span></>}
            <span>{pos.box_name}</span>
            <span className="text-lab-accent/50">/</span>
            <span className="font-medium">{positionLabel(pos.row, pos.col)}</span>
          </button>
        ) : (
          isActive && onAssignPosition && (
            <button type="button" onClick={() => onAssignPosition(tube.id)} className="inline-flex items-center gap-1.5 text-xs text-lab-faint border border-dashed border-lab-border px-2.5 py-1 rounded-lg hover:text-lab-accent hover:border-lab-accent/50 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              分配位置
            </button>
          )
        )}
      </div>

      {expanded && (
        <div className="border-t border-lab-border p-4">
          <h4 className="text-sm font-medium text-lab-text mb-3">用量记录</h4>
          <UsageTimeline tubeId={tube.id} />
        </div>
      )}

      <ArchiveModal open={showArchive} tubeId={tube.id} tubeName={`${tube.batch_number}${tube.tube_number ? ' #' + tube.tube_number : ''}`} onClose={() => setShowArchive(false)} onSuccess={onArchived ?? (() => {})} />
    </div>
  )
}

function ArchiveModal({ open, tubeId, tubeName, onClose, onSuccess }: {
  readonly open: boolean
  readonly tubeId: number
  readonly tubeName: string
  readonly onClose: () => void
  readonly onSuccess: () => void
}) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!reason.trim()) return
    setSubmitting(true)
    try {
      await archiveTube(tubeId, reason.trim())
      setReason('')
      onSuccess()
      onClose()
    } catch { /* handled */ }
    setSubmitting(false)
  }, [tubeId, reason, onSuccess, onClose])

  return (
    <Modal open={open} title="归档引探管" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-lab-muted">确定要归档 <span className="font-medium text-lab-text">{tubeName}</span> 吗？归档后将从冻存盒中移出。</p>
        <div>
          <label className="block text-xs font-medium text-lab-muted mb-1">归档原因 *</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="input-field"
            placeholder="如: 用完、过期、污染..."
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
          <button type="button" className="btn-danger" disabled={!reason.trim() || submitting} onClick={handleSubmit}>
            {submitting ? '归档中...' : '确认归档'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
