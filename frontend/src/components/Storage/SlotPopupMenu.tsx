import { useEffect, useRef } from 'react'
import type { GridTubeInfo } from '@/types'

interface Props {
  readonly tube: GridTubeInfo
  readonly position: { x: number; y: number }
  readonly onClose: () => void
  readonly onDetail: () => void
  readonly onUsage: () => void
  readonly onMoveCross: () => void
  readonly onArchive: () => void
}

export default function SlotPopupMenu({ tube, position, onClose, onDetail, onUsage, onMoveCross, onArchive }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [onClose])

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const rect = el.getBoundingClientRect()
    if (rect.right > window.innerWidth) el.style.left = `${position.x - rect.width}px`
    if (rect.bottom > window.innerHeight) el.style.top = `${position.y - rect.height}px`
  })

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-lab-raised rounded-xl shadow-panel-lg border border-lab-border py-1 w-48 overflow-hidden"
      style={{ left: position.x, top: position.y }}
    >
      <div className="px-3 py-2 border-b border-lab-border">
        <p className="text-sm font-medium text-lab-text truncate">{tube.primer_name}</p>
        <p className="text-xs text-lab-muted">{tube.batch_number}{tube.tube_number ? ` #${tube.tube_number}` : ''}</p>
        <p className="text-xs text-lab-muted">{tube.remaining_volume_ul} / {tube.initial_volume_ul} uL</p>
      </div>
      <MenuItem label="查看详情" onClick={onDetail} />
      <MenuItem label="记录用量" onClick={onUsage} />
      <MenuItem label="移动" onClick={onMoveCross} />
      <div className="border-t border-lab-border" />
      <MenuItem label="归档" onClick={onArchive} danger isLast />
    </div>
  )
}

function MenuItem({ label, onClick, danger, isLast }: { readonly label: string; readonly onClick: () => void; readonly danger?: boolean; readonly isLast?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
        danger ? 'text-lab-danger hover:bg-lab-danger/10' : 'text-lab-text hover:bg-lab-highlight'
      } ${isLast ? 'rounded-b-xl' : ''}`}
    >
      {label}
    </button>
  )
}
