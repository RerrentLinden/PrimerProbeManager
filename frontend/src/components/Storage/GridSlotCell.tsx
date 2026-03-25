import type { GridSlot } from '@/types'
import { isLowVolume } from '@/utils/format'
import { useLongPress } from '@/hooks/useLongPress'

interface Props {
  readonly slot: GridSlot
  readonly highlighted: boolean
  readonly onClick: () => void
  readonly onContextAction: (action: string) => void
}

export default function GridSlotCell({ slot, highlighted, onClick, onContextAction }: Props) {
  const { tube } = slot
  const isEmpty = !tube
  const isPrimer = tube?.primer_type === 'primer'
  const low = tube ? isLowVolume(tube.remaining_volume_ul, tube.initial_volume_ul) : false

  const longPressHandlers = useLongPress(() => {
    if (tube) onContextAction('menu')
  })

  const baseClass = isEmpty
    ? 'bg-gray-50 border-dashed border-slate-200 hover:bg-slate-100 cursor-pointer'
    : isPrimer
      ? 'bg-blue-50 border-blue-300 hover:bg-blue-100'
      : 'bg-orange-50 border-orange-300 hover:bg-orange-100'

  const lowClass = low ? 'ring-2 ring-red-500 animate-pulse-ring' : ''
  const highlightClass = highlighted ? 'ring-2 ring-yellow-400 animate-pulse' : ''

  return (
    <button
      type="button"
      onClick={onClick}
      {...longPressHandlers}
      className={`aspect-square border rounded-lg flex items-center justify-center p-1 transition-all text-center ${baseClass} ${lowClass} ${highlightClass}`}
      title={tube ? `${tube.primer_name} (${tube.batch_number}) - ${tube.remaining_volume_ul}uL` : '空位'}
    >
      {tube ? (
        <span className="text-[10px] leading-tight font-medium truncate block w-full">
          {tube.primer_name}
        </span>
      ) : (
        <span className="text-slate-300 text-lg">+</span>
      )}
    </button>
  )
}
