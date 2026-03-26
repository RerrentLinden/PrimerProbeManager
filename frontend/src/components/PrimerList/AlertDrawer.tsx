import type { LowVolumeAlert } from '@/types'
import VolumeBar from '@/components/common/VolumeBar'
import { positionLabel } from '@/utils/format'

interface Props {
  readonly open: boolean
  readonly alerts: LowVolumeAlert[]
  readonly onClose: () => void
}

export default function AlertDrawer({ open, alerts, onClose }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-lab-surface h-full overflow-y-auto shadow-xl border-l border-lab-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-lab-raised border-b border-lab-border px-4 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-lab-danger">低体积报警 ({alerts.length})</h3>
          <button type="button" onClick={onClose} className="text-lab-faint hover:text-lab-text">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-3">
          {alerts.map((a) => (
            <div key={a.tube_id} className="card p-3 border-lab-danger/30 shadow-[0_0_8px_rgba(255,71,87,0.1)]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-lab-text">{a.primer_name}</span>
                <span className="text-xs text-lab-muted">{a.batch_number}</span>
              </div>
              <VolumeBar remaining={a.remaining_volume_ul} initial={a.initial_volume_ul} />
              {a.position && (
                <p className="text-xs text-lab-muted mt-1">
                  {a.position.box_name} - {positionLabel(a.position.row, a.position.col)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
