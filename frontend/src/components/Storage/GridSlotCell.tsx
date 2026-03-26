import type { GridSlot } from '@/types'
import { isLowVolume } from '@/utils/format'

interface Props {
  readonly slot: GridSlot
  readonly highlighted: boolean
  readonly isDragSource: boolean
  readonly isDropTarget: boolean
  readonly isHoverTarget: boolean
  readonly totalCols: number
}

export default function GridSlotCell({ slot, highlighted, isDragSource, isDropTarget, isHoverTarget }: Props) {
  const { tube } = slot
  const isEmpty = !tube
  const isPrimer = tube?.primer_type === 'primer'
  const low = tube ? isLowVolume(tube.remaining_volume_ul, tube.initial_volume_ul) : false

  let base: string
  if (isEmpty) {
    base = isHoverTarget
      ? 'bg-lab-success/20 border-lab-success border-2 scale-105'
      : isDropTarget
        ? 'bg-lab-success/10 border-lab-success border-dashed'
        : 'bg-lab-bg border-dashed border-lab-border'
  } else if (isDragSource) {
    base = 'bg-lab-surface border-lab-border opacity-40 scale-90'
  } else {
    base = isPrimer ? 'bg-lab-accent/10 border-lab-accent/40' : 'bg-lab-probe/10 border-lab-probe/40'
  }

  const lowClass = low && !isDragSource ? 'ring-2 ring-lab-danger animate-pulse-ring' : ''
  const highlightClass = highlighted && !isDragSource ? 'ring-2 ring-lab-warning animate-pulse' : ''

  return (
    <div
      data-row={slot.row}
      data-col={slot.col}
      data-empty={isEmpty ? '1' : undefined}
      className={`slot-cell aspect-square border rounded-lg flex flex-col items-center justify-center p-0.5 transition-all duration-150 text-center select-none overflow-hidden ${base} ${lowClass} ${highlightClass}`}
    >
      {tube ? (
        <>
          <span className="slot-name leading-tight font-medium text-lab-text truncate block w-full">{tube.primer_name}</span>
          <span className="slot-sub leading-tight text-lab-muted truncate block w-full">{tube.batch_number}</span>
          {tube.tube_number && (
            <span className="slot-tag leading-tight text-lab-accent truncate block w-full">#{tube.tube_number}</span>
          )}
        </>
      ) : (
        <span className={`slot-plus ${isDropTarget ? 'text-lab-success' : 'text-lab-faint'}`}>+</span>
      )}
    </div>
  )
}
