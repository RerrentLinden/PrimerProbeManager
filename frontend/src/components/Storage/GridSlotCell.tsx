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

export default function GridSlotCell({ slot, highlighted, isDragSource, isDropTarget, isHoverTarget, totalCols }: Props) {
  const { tube } = slot
  const isEmpty = !tube
  const isPrimer = tube?.primer_type === 'primer'
  const low = tube ? isLowVolume(tube.remaining_volume_ul, tube.initial_volume_ul) : false

  // Adaptive font sizes based on grid density
  const nameSize = totalCols <= 5 ? 'text-[11px]' : totalCols <= 9 ? 'text-[9px]' : 'text-[7px]'
  const subSize = totalCols <= 5 ? 'text-[9px]' : totalCols <= 9 ? 'text-[8px]' : 'hidden'
  const tagSize = totalCols <= 9 ? 'text-[7px]' : 'hidden'

  let base: string
  if (isEmpty) {
    base = isHoverTarget
      ? 'bg-green-100 border-green-500 border-2 scale-105'
      : isDropTarget
        ? 'bg-green-50 border-green-300 border-dashed'
        : 'bg-gray-50 border-dashed border-slate-200'
  } else if (isDragSource) {
    base = 'bg-slate-100 border-slate-300 opacity-40 scale-90'
  } else {
    base = isPrimer ? 'bg-blue-50 border-blue-300' : 'bg-orange-50 border-orange-300'
  }

  const lowClass = low && !isDragSource ? 'ring-2 ring-red-500 animate-pulse-ring' : ''
  const highlightClass = highlighted && !isDragSource ? 'ring-2 ring-yellow-400 animate-pulse' : ''

  return (
    <div
      data-row={slot.row}
      data-col={slot.col}
      data-empty={isEmpty ? '1' : undefined}
      className={`aspect-square border rounded-lg flex flex-col items-center justify-center p-0.5 transition-all duration-150 text-center select-none overflow-hidden ${base} ${lowClass} ${highlightClass}`}
    >
      {tube ? (
        <>
          <span className={`${nameSize} leading-tight font-medium truncate block w-full`}>{tube.primer_name}</span>
          <span className={`${subSize} leading-tight text-slate-400 truncate block w-full`}>{tube.batch_number}</span>
          {tube.tube_number && (
            <span className={`${tagSize} leading-tight text-blue-400 truncate block w-full`}>#{tube.tube_number}</span>
          )}
        </>
      ) : (
        <span className={`${isDropTarget ? 'text-green-300' : 'text-slate-300'} ${totalCols <= 9 ? 'text-lg' : 'text-sm'}`}>+</span>
      )}
    </div>
  )
}
